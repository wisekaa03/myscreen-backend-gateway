import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions, JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

import { JWT_BASE_OPTIONS, MyscreenJwtPayload } from '@/shared/jwt.payload';

import {
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
  PreconditionFailedError,
  Status,
  AuthResponse,
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

  async authorization(user: UserEntity): Promise<AuthResponse> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, password, forgotConfirmKey, emailConfirmKey, ...data } = user;

    return {
      status: Status.Success,
      data,
    };
  }

  async login(
    login: LoginRequest,
    fingerprint?: string,
  ): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(login.email);

    const valid = user
      ? await this.userService.validateCredentials(user, login.password)
      : false;
    if (!valid) {
      this.logger.warn(`Password mismatched: "${login.password}"`);
      throw new UnauthorizedError();
    }

    const token = await this.generateAccessToken(user);
    const refresh = await this.generateRefreshToken(user, fingerprint);
    const payload = this.buildResponsePayload(token, refresh);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, password, forgotConfirmKey, emailConfirmKey, ...data } = user;
    return {
      status: Status.Success,
      payload,
      data,
    };
  }

  async register(
    login: RegisterRequest,
    fingerprint?: string,
  ): Promise<AuthResponse> {
    const user = await this.userService.create(login);

    const token = await this.generateAccessToken(user);
    const refresh = await this.generateRefreshToken(user, fingerprint);
    const payload = this.buildResponsePayload(token, refresh);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, password, forgotConfirmKey, emailConfirmKey, ...data } = user;
    return {
      status: Status.Success,
      payload,
      data,
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
    const token = await this.refreshTokenService.createRefreshToken(
      user,
      fingerprint,
    );

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
      this.logger.warn(`Refresh token "${encoded}" not found`);
      throw new PreconditionFailedError('Refresh token not found');
    }

    if (token.isRevoked) {
      this.logger.warn(`Refresh token "${encoded}" revoked`);
      throw new PreconditionFailedError('Refresh token revoked');
    }

    const user = await this.getUserFromRefreshTokenPayload(payload);

    if (!user) {
      this.logger.warn(`Refresh token "${encoded}" malformed`);
      throw new PreconditionFailedError('Refresh token malformed');
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
      throw new ForbiddenError(`User ${user.email} is disabled`);
    }

    const token = await this.generateAccessToken(user);

    return { user, token };
  }

  private async decodeRefreshToken(token: string): Promise<MyscreenJwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        this.logger.warn(`Token ${token} expired`);
        throw new PreconditionFailedError('Refresh token expired');
      } else {
        this.logger.warn(`Token ${token} malformed`);
        throw new PreconditionFailedError('Refresh token malformed');
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<UserEntity> {
    const subId = payload.sub;

    if (!subId) {
      this.logger.warn(`Token ${JSON.stringify(payload)} malformed`);
      throw new PreconditionFailedError('Refresh token malformed');
    }

    return this.userService.findById(subId);
  }

  private async getStoredTokenFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<RefreshTokenEntity | null> {
    const tokenId = payload.jti;

    if (!tokenId) {
      this.logger.warn(`Token ${JSON.stringify(payload)} malformed`);
      throw new PreconditionFailedError('Refresh token malformed');
    }

    return this.refreshTokenService.find(tokenId);
  }

  /**
   * Проверяет почту на соответствие
   * @async
   * @param {VerifyEmailRequestDto} body
   * @returns {SuccessResponseDto} Результат
   */
  async verifyEmail(body: VerifyEmailRequest): Promise<SuccessResponse> {
    const [email, verifyToken] = decodeMailToken(body.verify_email);

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestError();
    }

    if (user.verified) {
      throw new BadRequestError();
    }

    if (user.emailConfirmKey === verifyToken) {
      user.emailConfirmKey = null;
      user.verified = true;
      await this.userService.update(user);

      return {
        status: Status.Success,
      };
    }

    this.logger.warn(`Verify email '${verifyToken}' not equal to our records`);
    throw new BadRequestError();
  }

  /**
   * Выдает ссылку email пользователя
   * @async
   * @param {ResetPasswordInvitationRequestDto} body
   * @returns {SuccessResponseDto} Результат
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
   * @param {ResetPasswordVerifyRequestDto} body
   * @returns {SuccessResponseDto} Результат
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
