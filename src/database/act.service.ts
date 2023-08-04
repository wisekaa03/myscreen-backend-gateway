import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';
import { WalletService } from './wallet.service';
import { ActEntity } from './act.entity';
import { ActStatus } from '@/enums';

@Injectable()
export class ActService {
  constructor(
    private readonly walletService: WalletService,
    @InjectRepository(ActEntity)
    private readonly actRepository: Repository<ActEntity>,
  ) {}

  async find(
    find: FindManyOptions<ActEntity>,
  ): Promise<[Array<ActEntity>, number]> {
    return this.actRepository.findAndCount(TypeOrmFind.Nullable(find));
  }

  async findOne(find: FindManyOptions<ActEntity>): Promise<ActEntity | null> {
    return this.actRepository.findOne(TypeOrmFind.Nullable(find));
  }

  async create(
    user: UserEntity,
    sum: number,
    description?: string,
  ): Promise<ActEntity> {
    return this.actRepository.manager.transaction(async (tManager) => {
      const act: DeepPartial<ActEntity> = {
        sum,
        description,
        status: ActStatus.COMPLETE,
        userId: user.id,
      };

      const tActCreate = await tManager.save(
        ActEntity,
        tManager.create(ActEntity, act),
      );

      await tManager.save(
        WalletEntity,
        this.walletService.create({ user, act: tActCreate }),
      );

      return tActCreate;
    });
  }
}
