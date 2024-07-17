import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { ActStatus } from '@/enums';
import {
  FindManyOptionsCaseInsensitive,
  FindOneOptionsCaseInsensitive,
} from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { WalletEntity } from './wallet.entity';
import { ActEntity } from './act.entity';
import { WalletService } from '@/database/wallet.service';
import { UserResponse } from './user-response.entity';
import { UserEntity } from './user.entity';
import { WsStatistics } from './ws.statistics';

@Injectable()
export class ActService {
  private logger = new Logger(ActService.name);

  constructor(
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    @Inject(forwardRef(() => WsStatistics))
    private readonly wsStatistics: WsStatistics,
    @InjectRepository(ActEntity)
    private readonly actRepository: Repository<ActEntity>,
  ) {}

  async find(
    find: FindManyOptionsCaseInsensitive<ActEntity>,
  ): Promise<ActEntity[]> {
    return !find.caseInsensitive
      ? this.actRepository.find(TypeOrmFind.findParams(ActEntity, find))
      : TypeOrmFind.findCI(
          this.actRepository,
          TypeOrmFind.findParams(ActEntity, find),
        );
  }

  async findAndCount(
    find: FindManyOptionsCaseInsensitive<ActEntity>,
  ): Promise<[ActEntity[], number]> {
    return !find.caseInsensitive
      ? this.actRepository.findAndCount(TypeOrmFind.findParams(ActEntity, find))
      : TypeOrmFind.findAndCountCI(
          this.actRepository,
          TypeOrmFind.findParams(ActEntity, find),
        );
  }

  async findOne(
    find: FindOneOptionsCaseInsensitive<ActEntity>,
  ): Promise<ActEntity | null> {
    return !find.caseInsensitive
      ? this.actRepository.findOne(TypeOrmFind.findParams(ActEntity, find))
      : TypeOrmFind.findOneCI(
          this.actRepository,
          TypeOrmFind.findParams(ActEntity, find),
        );
  }

  async create({
    user,
    sum,
    isSubscription = false,
    description,
  }: {
    user: UserResponse | UserEntity;
    sum: number;
    isSubscription: boolean;
    description?: string;
  }): Promise<ActEntity> {
    return this.actRepository.manager.transaction(async (transact) => {
      const actCreated: DeepPartial<ActEntity> = {
        sum,
        description: description ?? this.walletService.subscriptionDescription,
        isSubscription,
        status: ActStatus.COMPLETE,
        userId: user.id,
      };

      const actCreate = await transact.save(
        ActEntity,
        transact.create(ActEntity, actCreated),
      );

      await transact.save(
        WalletEntity,
        this.walletService.create({ user, act: actCreate }),
      );

      await this.wsStatistics.onWallet(user);

      return actCreate;
    });
  }
}
