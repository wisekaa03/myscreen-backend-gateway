import ms from 'ms';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { type DeepPartial, MoreThan, Repository } from 'typeorm';

import { RefreshTokenEntity } from './refreshtoken.entity';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenEntity: Repository<RefreshTokenEntity>,
  ) {}

  async find(id: string, fromMonitor = false): Promise<RefreshTokenEntity> {
    if (fromMonitor) {
      return this.refreshTokenEntity.create({
        id,
        expires: new Date(
          Date.now() +
            ms(this.configService.get<string>('JWT_REFRESH_EXPIRES', '30days')),
        ),
        isRevoked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

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
    userAgent?: string,
  ): Promise<RefreshTokenEntity> {
    const expires = new Date(
      Date.now() +
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRES', '30days')),
    );

    const refreshTokenExist = await this.refreshTokenEntity.findOne({
      where: {
        userId,
        isRevoked: false,
        expires: MoreThan(new Date(Date.now())),
      },
    });

    const token: DeepPartial<RefreshTokenEntity> = {
      ...refreshTokenExist,
      userId,
      isRevoked: false,
      fingerprint,
      userAgent,
      expires,
    };

    return this.refreshTokenEntity.save(this.refreshTokenEntity.create(token));
  }
}
