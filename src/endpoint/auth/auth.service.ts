import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions, JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

import { JWT_BASE_OPTIONS, MyscreenJwtPayload } from '@/shared/jwt.payload';
import { Status } from '@/dto/status.enum';
import type { LoginRequestDto } from '@/dto/request/login.request';
import type { RegisterRequestDto } from '@/dto/request/register.request';
import type {
  AuthenticationPayloadDto,
  AuthResponseDto,
} from '@/dto/response/authentication.response';
import type { RefreshTokenResponseDto } from '@/dto/response/refresh.response';
import type { RefreshTokenRequestDto } from '@/dto/request/refresh-token.request';
import { UserService } from '@/database/user.service';
import { UserEntity } from '@/database/user.entity';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { RefreshTokenEntity } from '@/database/refreshtoken.entity';
import { ForbiddenError } from '@/dto/errors/forbidden.reponse';
import { UnauthorizedError } from '@/dto/errors/unauthorized.reponse';
import { PreconditionFailedError } from '@/dto/errors/precondition.response';

@Injectable()
export class AuthService {
  logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async authorization(user: UserEntity): Promise<AuthResponseDto> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, password, forgot_confirm_key, email_confirm_key, ...data } =
      user;

    return {
      status: Status.Success,
      data,
    };
  }

  async login(
    login: LoginRequestDto,
    fingerprint?: string,
  ): Promise<AuthResponseDto> {
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
    const { id, password, forgot_confirm_key, email_confirm_key, ...data } =
      user;
    return {
      status: Status.Success,
      payload,
      data,
    };
  }

  async register(
    login: RegisterRequestDto,
    fingerprint?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.userService.create(login);

    const token = await this.generateAccessToken(user);
    const refresh = await this.generateRefreshToken(user, fingerprint);
    const payload = this.buildResponsePayload(token, refresh);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { id, password, forgot_confirm_key, email_confirm_key, ...data } =
      user;
    return {
      status: Status.Success,
      payload,
      data,
    };
  }

  async refresh(
    body: RefreshTokenRequestDto,
    fingerprint?: string,
  ): Promise<RefreshTokenResponseDto> {
    const { token } = await this.createAccessTokenFromRefreshToken(
      body.refresh_token,
      fingerprint,
    );

    return { token };
  }

  private buildResponsePayload(
    token: string,
    refresh_token?: string,
  ): AuthenticationPayloadDto {
    const payload: AuthenticationPayloadDto = {
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
}
