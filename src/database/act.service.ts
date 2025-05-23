import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';

import { ActStatus } from '@/enums';
import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { WalletEntity } from './wallet.entity';
import { ActEntity } from './act.entity';
import { WalletService } from '@/database/wallet.service';
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
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async find(find: FindManyOptionsExt<ActEntity>): Promise<ActEntity[]> {
    return !find.caseInsensitive
      ? this.actRepository.find(TypeOrmFind.findParams(ActEntity, find))
      : TypeOrmFind.findCI(
          this.actRepository,
          TypeOrmFind.findParams(ActEntity, find),
        );
  }

  async findAndCount(
    find: FindManyOptionsExt<ActEntity>,
  ): Promise<[ActEntity[], number]> {
    return !find.caseInsensitive
      ? this.actRepository.findAndCount(TypeOrmFind.findParams(ActEntity, find))
      : TypeOrmFind.findAndCountCI(
          this.actRepository,
          TypeOrmFind.findParams(ActEntity, find),
        );
  }

  async findOne(find: FindOneOptionsExt<ActEntity>): Promise<ActEntity | null> {
    return !find.caseInsensitive
      ? this.actRepository.findOne(TypeOrmFind.findParams(ActEntity, find))
      : TypeOrmFind.findOneCI(
          this.actRepository,
          TypeOrmFind.findParams(ActEntity, find),
        );
  }

  async create({
    userId,
    sum,
    isSubscription = false,
    description,
    transact: _transact,
  }: {
    userId: string;
    sum: number;
    isSubscription: boolean;
    description: string;
    transact?: EntityManager;
  }): Promise<ActEntity> {
    const transact = _transact ?? this.entityManager;

    const created = await transact.transaction(
      'REPEATABLE READ',
      async (transact) => {
        const actCreated: DeepPartial<ActEntity> = {
          sum,
          description,
          isSubscription,
          status: ActStatus.COMPLETE,
          userId,
        };

        const actCreate = await transact.save(
          ActEntity,
          transact.create(ActEntity, actCreated),
        );

        await transact.save(
          WalletEntity,
          this.walletService.create({
            userId,
            sum: -sum,
            description,
            actId: actCreate.id,
          }),
        );

        return actCreate;
      },
    );

    await this.wsStatistics.onWallet({ userId, transact: _transact });

    return created;
  }
}
