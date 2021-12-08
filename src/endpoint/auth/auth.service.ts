import {
  Injectable,
  Logger,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions, JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

import { JWT_BASE_OPTIONS, MyscreenJwtPayload } from '@/shared/jwt.payload';

import {
  Status,
  userEntityToUser,
  AuthResponse,
  UserUpdateRequest,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ResetPasswordVerifyRequest,
  RefreshTokenResponse,
  AuthenticationPayload,
  SuccessResponse,
  ResetPasswordInvitationRequest,
} from '@/dto';

import { UserService } from '@/database/user.service';
import { UserEntity } from '@/database/user.entity';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { RefreshTokenEntity } from '@/database/refreshtoken.entity';

import { decodeMailToken } from '@/shared/mail-token';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async update(
    user: UserEntity,
    update: UserUpdateRequest,
  ): Promise<UserEntity> {
    return this.userService.update(user, update);
  }

  async login(
    login: LoginRequest,
    fingerprint?: string,
  ): Promise<AuthResponse> {
    if (!login.email || !login.password) {
      throw new UnauthorizedException('Password mismatched', login.password);
    }

    const user = await this.userService.findByEmail(login.email, false, true);
    if (!user) {
      throw new UnauthorizedException('Password mismatched', login.password);
    }
    if (!user.verified) {
      throw new UnauthorizedException(
        'You have to respond to our email',
        login.email,
      );
    }

    const valid = user
      ? await this.userService.validateCredentials(user, login.password)
      : false;
    if (!valid) {
      throw new UnauthorizedException('Password mismatched', login.password);
    }

    const token = await this.generateAccessToken(user);
    const refresh = await this.generateRefreshToken(user, fingerprint);
    const payload = this.buildResponsePayload(token, refresh);

    return {
      status: Status.Success,
      payload,
      data: userEntityToUser(user),
    };
  }

  async register(create: RegisterRequest): Promise<AuthResponse> {
    const user = await this.userService.create(create);

    return {
      status: Status.Success,
      data: userEntityToUser(user),
    };
  }

  async refresh(
    body: RefreshTokenRequest,
    fingerprint?: string,
  ): Promise<RefreshTokenResponse> {
    const { token } = await this.createAccessTokenFromRefreshToken(
      body.refresh_token,
      fingerprint,
    );

    return { token };
  }

  private buildResponsePayload(
    token: string,
    refresh_token?: string,
  ): AuthenticationPayload {
    const payload: AuthenticationPayload = {
      type: 'bearer',
      token,
    };
    if (refresh_token) {
      payload.refresh_token = refresh_token;
    }
    return payload;
  }

  async generateAccessToken(user: UserEntity): Promise<string> {
    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS,
      subject: String(user.id),
      expiresIn: Number(this.configService.get('JWT_ACCESS_EXPIRES')),
    };

    return this.jwtService.signAsync({}, opts);
  }

  async generateRefreshToken(
    user: UserEntity,
    fingerprint?: string,
  ): Promise<string> {
    const token = await this.refreshTokenService.create(user, fingerprint);

    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS,
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES'),
      subject: String(user.id),
      jwtid: String(token.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  async resolveRefreshToken(
    encoded: string,
  ): Promise<{ user: UserEntity; token: RefreshTokenEntity }> {
    const payload = await this.decodeRefreshToken(encoded);
    const token = await this.getStoredTokenFromRefreshTokenPayload(payload);

    if (!token) {
      throw new ForbiddenException(`Refresh token '${encoded}' not found`);
    }

    if (token.isRevoked) {
      throw new ForbiddenException(`Refresh token '${encoded}' revoked`);
    }

    const user = await this.getUserFromRefreshTokenPayload(payload);

    if (!user) {
      throw new ForbiddenException(`Refresh token '${encoded}' malformed`);
    }

    return { user, token };
  }

  async createAccessTokenFromRefreshToken(
    refresh: string,
    fingerprint?: string,
  ): Promise<{ token: string; user: UserEntity }> {
    const { user } = await this.resolveRefreshToken(refresh);
    if (user.disabled) {
      this.logger.warn(`User ${user.email} is disabled`);
      throw new ForbiddenException(`User ${user.email} is disabled`);
    }

    const token = await this.generateAccessToken(user);

    return { user, token };
  }

  private async decodeRefreshToken(token: string): Promise<MyscreenJwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new ForbiddenException(`Token ${token} expired`);
      } else {
        throw new ForbiddenException(`Token ${token} malformed`);
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<UserEntity | undefined> {
    const subId = payload.sub;

    if (!subId) {
      throw new ForbiddenException(
        `Token ${JSON.stringify(payload)} malformed`,
      );
    }

    return this.userService.findById(subId);
  }

  private async getStoredTokenFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<RefreshTokenEntity | null> {
    const tokenId = payload.jti;

    if (!tokenId) {
      throw new ForbiddenException(
        `Token ${JSON.stringify(payload)} malformed`,
      );
    }

    return this.refreshTokenService.find(tokenId);
  }

  /**
   * Проверяет почту на соответствие
   * @async
   * @param {VerifyEmailRequest} body
   * @returns {SuccessResponse} Результат
   */
  async verifyEmail(body: VerifyEmailRequest): Promise<SuccessResponse> {
    const [email, verifyToken] = decodeMailToken(body.verify_email);

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException();
    }

    if (user.verified) {
      throw new BadRequestException();
    }

    if (user.emailConfirmKey === verifyToken) {
      await this.userService.update(user, {
        emailConfirmKey: null,
        verified: true,
      });

      return {
        status: Status.Success,
      };
    }

    throw new ForbiddenException(
      `Verify email '${verifyToken}' not equal to our records`,
    );
  }

  /**
   * Выдает ссылку email пользователя
   * @async
   * @param {ResetPasswordInvitationRequest} body
   * @returns {SuccessResponse} Результат
   */
  async forgotPasswordInvitation(
    body: ResetPasswordInvitationRequest,
  ): Promise<SuccessResponse> {
    await this.userService.forgotPasswordInvitation(body.email);

    return {
      status: Status.Success,
    };
  }

  /**
   * Меняет пароль пользователя
   * @async
   * @param {ResetPasswordVerifyRequest} body
   * @returns {SuccessResponse} Результат
   */
  async forgotPasswordVerify(
    body: ResetPasswordVerifyRequest,
  ): Promise<SuccessResponse> {
    await this.userService.forgotPasswordVerify(
      body.verify_code,
      body.password,
    );

    return {
      status: Status.Success,
    };
  }
}
