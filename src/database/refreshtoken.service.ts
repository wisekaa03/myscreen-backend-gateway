import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { FindConditions, MoreThan, Repository } from 'typeorm';

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
    const where: FindConditions<RefreshTokenEntity>[] = [
      {
        id,
        expires: MoreThan(new Date(Date.now())),
      },
    ];

    return this.refreshTokenEntity.findOne({
      where,
    });
  }

  async createRefreshToken(
    user: UserEntity,
    fingerprint?: string,
  ): Promise<RefreshTokenEntity> {
    const expires = new Date(
      Date.now() + Number(this.configService.get('JWT_REFRESH_EXPIRES')) * 1000,
    );

    const token: RefreshTokenEntity = {
      user,
      isRevoked: false,
      fingerprint,
      expires,
    };

    return this.refreshTokenEntity.save(token);
  }
}
