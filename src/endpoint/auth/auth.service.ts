import {
  Injectable,
  Logger,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type JwtSignOptions, JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';

import {
  JWT_BASE_OPTIONS,
  type MyscreenJwtPayload,
} from '@/shared/jwt.payload';

import { userEntityToUser, AuthenticationPayload } from '@/dto';

import { UserService } from '@/database/user.service';
import { UserEntity } from '@/database/user.entity';
import { RefreshTokenService } from '@/database/refreshtoken.service';
import { RefreshTokenEntity } from '@/database/refreshtoken.entity';

import { decodeMailToken } from '@/shared/mail-token';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
    fingerprint?: string,
  ): Promise<[Partial<UserEntity>, AuthenticationPayload]> {
    if (!email || !password) {
      throw new UnauthorizedException('Password mismatched', password);
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Password mismatched', password);
    }
    if (!user.verified) {
      throw new ForbiddenException('You have to respond to our email', email);
    }

    const valid = user.password
      ? this.userService.validateCredentials(user, password)
      : false;
    if (!valid) {
      throw new UnauthorizedException('Password mismatched', password);
    }

    const [token, refresh] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user, fingerprint),
    ]);
    const payload = this.buildResponsePayload(token, refresh);

    return [userEntityToUser(user), payload];
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

  async createAccessTokenFromRefreshToken(refresh: string): Promise<string> {
    const user = await this.resolveRefreshToken(refresh);
    if (user.disabled) {
      this.logger.warn(`User '${user.email}' is disabled`);
      throw new ForbiddenException(`User '${user.email}' is disabled`);
    }

    return this.generateAccessToken(user);
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
    const { sub } = payload;

    if (!sub) {
      throw new ForbiddenException(
        `Token ${JSON.stringify(payload)} malformed`,
      );
    }

    return this.userService.findById(sub);
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
   * @param {string} verify_email Токен
   * @returns {true} Результат
   */
  async verifyEmail(verify_email: string): Promise<true> {
    const [email, verifyToken] = decodeMailToken(verify_email);

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.verified) {
      throw new UnauthorizedException();
    }

    if (user.emailConfirmKey === verifyToken) {
      await this.userService.update(user, {
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
