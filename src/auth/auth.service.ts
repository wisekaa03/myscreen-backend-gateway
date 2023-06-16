import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JwtSignOptions, JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

import addMonths from 'date-fns/addMonths';
import { UserRoleEnum } from '../enums/role.enum';
import {
  JWT_BASE_OPTIONS,
  type MyscreenJwtPayload,
} from '../shared/jwt.payload';
import {
  userEntityToUser,
  AuthenticationPayload,
  selectUserOptions,
} from '../dto/index';
import { UserService } from '../database/user.service';
import { UserEntity } from '../database/user.entity';
import { RefreshTokenService } from '../database/refreshtoken.service';
import { RefreshTokenEntity } from '../database/refreshtoken.entity';
import { decodeMailToken } from '../shared/mail-token';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  private accessTokenExpires: string;

  private refreshTokenExpires: string;

  private secretAccessToken: string;

  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.accessTokenExpires = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES',
      '10min',
    );
    this.refreshTokenExpires = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
      '30days',
    );
    this.secretAccessToken = this.configService.get<string>(
      'JWT_ACCESS_TOKEN',
      'what ?',
    );
  }

  async login(
    email: string,
    password: string,
    fingerprint?: string,
  ): Promise<[Partial<UserEntity>, AuthenticationPayload]> {
    if (!email || !password) {
      throw new ForbiddenException('Password mismatched', password);
    }

    const user = await this.userService.findByEmail(email, {
      select: { ...selectUserOptions, password: true },
    });
    if (!user) {
      throw new ForbiddenException('Password mismatched', password);
    }
    if (
      user.isDemoUser &&
      user.createdAt &&
      addMonths(user.createdAt, 1) <= new Date()
    ) {
      throw new ForbiddenException(
        'You have a Demo User account. Time to pay.',
      );
    }
    if (!user.verified) {
      throw new ForbiddenException('You have to respond to our email', email);
    }

    const valid = user.password
      ? this.userService.validateCredentials(user, password)
      : false;
    if (!valid) {
      throw new ForbiddenException('Password mismatched', password);
    }

    const [token, refresh] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user.id, fingerprint),
    ]);
    const payload = this.buildResponsePayload(token, refresh);

    return [userEntityToUser(user), payload];
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

  async generateAccessToken(user: UserEntity): Promise<string> {
    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS,
      subject: String(user.id),
      audience: [user.role],
      expiresIn: this.accessTokenExpires,
    };

    return this.jwtService.signAsync({}, opts);
  }

  async generateRefreshToken(
    userId: string,
    fingerprint?: string,
  ): Promise<string> {
    const refreshTokenUpdated = await this.refreshTokenService.create(
      userId,
      fingerprint,
    );

    const opts: JwtSignOptions = {
      ...JWT_BASE_OPTIONS,
      expiresIn: this.refreshTokenExpires,
      subject: String(userId),
      jwtid: String(refreshTokenUpdated.id),
    };

    return this.jwtService.signAsync({}, opts);
  }

  async resolveRefreshToken(encoded: string): Promise<UserEntity> {
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

    return user;
  }

  async createAccessTokenFromRefreshToken(
    refreshToken: string,
    fingerprint: string,
  ): Promise<AuthenticationPayload> {
    const user = await this.resolveRefreshToken(refreshToken);
    if (user.disabled) {
      this.logger.warn(`User '${user.email}' is disabled`);
      throw new ForbiddenException(`User '${user.email}' is disabled`);
    }

    if (user.role === UserRoleEnum.Monitor) {
      return this.createMonitorToken(user.id);
    }

    const [token, refreshTokenUpdated] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user.id, fingerprint),
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
      } as UserEntity),
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
        throw new ForbiddenException(`Token ${token} expired`);
      } else {
        throw new ForbiddenException(`Token ${token} malformed`);
      }
    }
  }

  private async getUserFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<UserEntity | null> {
    const { sub, iss } = payload;

    if (!sub) {
      throw new ForbiddenException(
        `Token ${JSON.stringify(payload)} malformed`,
      );
    }

    if (iss === 'false') {
      return this.userService.findById(sub, [UserRoleEnum.Monitor]);
    }
    return this.userService.findById(sub);
  }

  private async getStoredTokenFromRefreshTokenPayload(
    payload: MyscreenJwtPayload,
  ): Promise<RefreshTokenEntity | null> {
    const { jti: tokenId, iss } = payload;
    if (!tokenId) {
      throw new ForbiddenException(
        `Token ${JSON.stringify(payload)} malformed`,
      );
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
      select: { ...selectUserOptions, emailConfirmKey: true },
    });
    if (!user) {
      throw new ForbiddenException();
    }
    if (user.verified) {
      throw new ForbiddenException();
    }

    if (user.emailConfirmKey === verifyToken) {
      await this.userService.update(user.id, {
        emailConfirmKey: null,
        verified: true,
      });

      return true;
    }

    throw new ForbiddenException(
      `Verify email '${verifyToken}' not equal to our records`,
    );
  }
}
