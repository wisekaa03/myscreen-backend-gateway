import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { ActStatus } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';
import { ActEntity } from './act.entity';
import { WalletService } from '@/database/wallet.service';

@Injectable()
export class ActService {
  private logger = new Logger(ActService.name);

  private acceptanceActDescription: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    @InjectRepository(ActEntity)
    private readonly actRepository: Repository<ActEntity>,
  ) {
    this.acceptanceActDescription = this.configService.get<string>(
      'ACCEPTANCE_ACT_DESCRIPTION',
      'Оплата за услуги',
    );
  }

  async find(
    find: FindManyOptions<ActEntity>,
  ): Promise<[Array<ActEntity>, number]> {
    return this.actRepository.findAndCount(TypeOrmFind.findParams(find));
  }

  async findOne(find: FindManyOptions<ActEntity>): Promise<ActEntity | null> {
    return this.actRepository.findOne(TypeOrmFind.findParams(find));
  }

  async create({
    user,
    sum,
    description,
  }: {
    user: UserEntity;
    sum: number;
    description?: string;
  }): Promise<ActEntity> {
    return this.actRepository.manager.transaction(async (transact) => {
      const actCreated: DeepPartial<ActEntity> = {
        sum,
        description: description ?? this.acceptanceActDescription,
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

      return actCreate;
    });
  }
}
