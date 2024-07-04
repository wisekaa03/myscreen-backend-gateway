import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JwtSignOptions, JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

import { ForbiddenError } from '@/errors';
import { UserRoleEnum } from '@/enums';
import { JWT_BASE_OPTIONS, type MyscreenJwtPayload } from '@/utils/jwt.payload';
import { decodeMailToken } from '@/utils/mail-token';
import { AuthenticationPayload } from '@/dto';
import { UserService } from '@/database/user.service';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { RefreshTokenEntity } from '@/database/refreshtoken.entity';
import { UserResponse } from '@/database/user-response.entity';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  public accessTokenExpires: string;

  public refreshTokenExpires: string;

  public secretAccessToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {
    this.accessTokenExpires =
      this.configService.getOrThrow('JWT_ACCESS_EXPIRES');
    this.refreshTokenExpires = this.configService.getOrThrow(
      'JWT_REFRESH_EXPIRES',
    );
    this.secretAccessToken = this.configService.getOrThrow('JWT_ACCESS_TOKEN');
  }

  async login(
    email: string,
    password: string,
    fingerprint?: string,
    userAgent?: string,
  ): Promise<[UserResponse, AuthenticationPayload]> {
    if (!email || !password) {
      throw new ForbiddenError('PASSWORD_MISMATCHED');
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new ForbiddenError('PASSWORD_MISMATCHED');
    }
    if (!user.verified) {
      throw new ForbiddenError('YOU_HAVE_TO_RESPOND');
    }

    const valid = user.password
      ? UserService.validateCredentials(user, password)
      : false;
    if (!valid) {
      throw new ForbiddenError('PASSWORD_MISMATCHED');
    }

    const [token, refresh] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user.id, fingerprint, userAgent),
    ]);
    const payload = this.buildResponsePayload(token, refresh);

    return [user, payload];
  }

  private buildResponsePayload(
    token: string,
    refreshToken?: string,
  ): AuthenticationPayload {
    const payload: AuthenticationPayload = {
      type: 'bearer',
      token,
    };
    if (refreshToken) {
      payload.refreshToken = refreshToken;
    }
    return payload;
  }

  async generateAccessToken(user: UserResponse): Promise<string> {
    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS,
      subject: String(user.id),
      audience: user.role,
      expiresIn: this.accessTokenExpires,
    };

    return this.jwtService.signAsync({}, opts);
  }

  async generateRefreshToken(
    userId: string,
    fingerprint?: string,
    userAgent?: string,
  ): Promise<string> {
    const refreshTokenUpdated = await this.refreshTokenService.create(
      userId,
      fingerprint,
      userAgent,
    );

    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS,
      expiresIn: this.refreshTokenExpires,
      subject: String(userId),
      jwtid: String(refreshTokenUpdated.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  async resolveRefreshToken(encoded: string): Promise<UserResponse> {
    const payload = await this.decodeRefreshToken(encoded);
    const token = await this.getStoredTokenFromRefreshTokenPayload(payload);

    if (!token) {
      throw new ForbiddenError(`Refresh token '${encoded}' not found`);
    }
    if (token.isRevoked) {
      throw new ForbiddenError(`Refresh token '${encoded}' revoked`);
    }

    const user = await this.getUserFromRefreshTokenPayload(payload);
    if (!user) {
      throw new ForbiddenError(`Refresh token '${encoded}' malformed`);
    }

    return user;
  }

  async createAccessTokenFromRefreshToken(
    refreshToken: string,
    fingerprint: string,
    userAgent: string,
  ): Promise<AuthenticationPayload> {
    const user = await this.resolveRefreshToken(refreshToken);
    if (user.disabled) {
      this.logger.warn(`User '${user.email}' is disabled`);
      throw new ForbiddenError(`User '${user.email}' is disabled`);
    }

    if (user.role === UserRoleEnum.Monitor) {
      return this.createMonitorToken(user.id);
    }

    const [token, refreshTokenUpdated] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user.id, fingerprint, userAgent),
    ]);

    return this.buildResponsePayload(token, refreshTokenUpdated);
  }

  async createMonitorRefreshToken(monitorId: string): Promise<string> {
    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS,
      expiresIn: this.refreshTokenExpires,
      subject: String(monitorId),
      jwtid: String(monitorId),
      issuer: 'false',
    };

    return this.jwtService.signAsync({}, opts);
  }

  async createMonitorToken(monitorId: string): Promise<AuthenticationPayload> {
    const [token, refreshToken] = await Promise.all([
      this.generateAccessToken({
        id: monitorId,
        role: UserRoleEnum.Monitor,
      } as UserResponse),
      this.createMonitorRefreshToken(monitorId),
    ]);

    return this.buildResponsePayload(token, refreshToken);
  }

  private async decodeRefreshToken(token: string): Promise<MyscreenJwtPayload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        ...JWT_BASE_OPTIONS,
      });
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new ForbiddenError(`Token '${token}' expired`);
      } else {
        throw new ForbiddenError(`Token '${token}' malformed`);
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<UserResponse | null> {
    const { sub, iss } = payload;

    if (!sub) {
      throw new ForbiddenError(`Token '${JSON.stringify(payload)}' malformed`);
    }

    if (iss === 'false') {
      return this.userService.findById(sub, UserRoleEnum.Monitor);
    }
    return this.userService.findById(sub);
  }

  private async getStoredTokenFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<RefreshTokenEntity | null> {
    const { jti: tokenId, iss } = payload;
    if (!tokenId) {
      throw new ForbiddenError(`Token '${JSON.stringify(payload)}' malformed`);
    }

    if (iss === 'false') {
      return this.refreshTokenService.find(tokenId, true);
    }

    return this.refreshTokenService.find(tokenId);
  }

  async jwtVerify(token: string): Promise<MyscreenJwtPayload> {
    return this.jwtService.verifyAsync(token, {
      ...JWT_BASE_OPTIONS,
    });
  }

  /**
   * Проверяет почту на соответствие
   * @async
   * @param {string} verify_email Токен
   * @returns {true} Результат
   */
  async verifyEmail(verify_email: string): Promise<true> {
    const [email, verifyToken] = decodeMailToken(verify_email);

    const user = await this.userService.findByEmail(email, {
      select: ['id', 'verified', 'emailConfirmKey'],
    });
    if (!user) {
      throw new ForbiddenError();
    }
    if (user.verified) {
      throw new ForbiddenError();
    }

    if (user.emailConfirmKey === verifyToken) {
      await this.userService.update(user.id, {
        emailConfirmKey: null,
        verified: true,
      });

      return true;
    }

    throw new ForbiddenError(
      `Verify email '${verifyToken}' not equal to our records`,
    );
  }
}
