import ms from 'ms';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeepPartial, MoreThan, Repository } from 'typeorm';

import { RefreshTokenEntity } from './refreshtoken.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenEntity: Repository<RefreshTokenEntity>,
    private readonly configService: ConfigService,
  ) {}

  async find(id: string): Promise<RefreshTokenEntity> {
    return this.refreshTokenEntity.findOneOrFail({
      where: {
        id,
        expires: MoreThan(new Date(Date.now())),
      },
    });
  }

  async create(
    userId: string,
    fingerprint?: string,
    refreshToken?: string,
  ): Promise<RefreshTokenEntity> {
    const expires = new Date(
      Date.now() +
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRES', '30days')),
    );

    const refreshTokenExist = await this.refreshTokenEntity.findOne({
      where: {
        userId,
        fingerprint,
        isRevoked: false,
        expires: MoreThan(new Date(Date.now())),
      },
    });

    const token: DeepPartial<RefreshTokenEntity> = {
      ...refreshTokenExist,
      userId,
      isRevoked: false,
      fingerprint,
      expires,
    };

    return this.refreshTokenEntity.save(this.refreshTokenEntity.create(token));
  }
}
