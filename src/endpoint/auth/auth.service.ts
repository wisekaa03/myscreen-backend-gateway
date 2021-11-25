import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions, JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { plainToInstance } from 'class-transformer';

import { JWT_BASE_OPTIONS, MyscreenJwtPayload } from '@/shared/jwt.payload';
import { Status } from '@/dto/status.enum';
import { LoginRequestDto } from '@/dto/request/login.request';
import { RegisterRequestDto } from '@/dto/request/register.request';
import {
  AuthenticationPayload,
  AuthResponseDto,
  RefreshTokenResponseDto,
} from '@/dto/response/auth.response';
import { RefreshTokenRequestDto } from '@/dto/request/refresh-token.request';
import { ForbiddenErrorResponse } from '@/dto/response/forbidden.reponse';
import { UnauthorizedErrorResponse } from '@/dto/response/unauthorized.reponse';
import { UserService } from '@/database/user.service';
import { UserEntity } from '@/database/user.entity';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { RefreshTokenEntity } from '@/database/refreshtoken.entity';
import { PreconditionFailedErrorResponse } from '@/dto/response/precondition.response';

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
      throw new UnauthorizedErrorResponse();
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
      throw new PreconditionFailedErrorResponse('Refresh token not found');
    }

    if (token.isRevoked) {
      throw new PreconditionFailedErrorResponse('Refresh token revoked');
    }

    const user = await this.getUserFromRefreshTokenPayload(payload);

    if (!user) {
      throw new PreconditionFailedErrorResponse('Refresh token malformed');
    }

    return { user, token };
  }

  async createAccessTokenFromRefreshToken(
    refresh: string,
    fingerprint?: string,
  ): Promise<{ token: string; user: UserEntity }> {
    const { user } = await this.resolveRefreshToken(refresh);
    if (user.disabled) {
      this.logger.warn(`User ${user.email} is disabled.`);
      throw new ForbiddenErrorResponse(`User ${user.email} is disabled.`);
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
        throw new PreconditionFailedErrorResponse('Refresh token expired');
      } else {
        this.logger.warn(`Token ${token} malformed`);
        throw new PreconditionFailedErrorResponse('Refresh token malformed');
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<UserEntity> {
    const subId = payload.sub;

    if (!subId) {
      this.logger.warn(`Token ${JSON.stringify(payload)} malformed`);
      throw new PreconditionFailedErrorResponse('Refresh token malformed');
    }

    return this.userService.findById(subId);
  }

  private async getStoredTokenFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<RefreshTokenEntity | null> {
    const tokenId = payload.jti;

    if (!tokenId) {
      this.logger.warn(`Token ${JSON.stringify(payload)} malformed`);
      throw new PreconditionFailedErrorResponse('Refresh token malformed');
    }

    return this.refreshTokenService.find(tokenId);
  }
}
