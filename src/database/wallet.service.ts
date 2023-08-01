import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { InvoiceEntity } from './invoice.entity';
import { UserEntity } from './user.entity';
import { WalletEntity } from './wallet.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,
  ) {}

  async find(
    find: FindManyOptions<WalletEntity>,
  ): Promise<[Array<WalletEntity>, number]> {
    return this.walletRepository.findAndCount(TypeOrmFind.Nullable(find));
  }

  async findOne(
    find: FindManyOptions<WalletEntity>,
  ): Promise<WalletEntity | null> {
    return this.walletRepository.findOne(TypeOrmFind.Nullable(find));
  }

  create(user: UserEntity, invoice: InvoiceEntity): WalletEntity {
    const wallet: DeepPartial<WalletEntity> = {
      sum: invoice.sum,
      invoice,
      user,
    };

    return this.walletRepository.create(wallet);
  }

  async walletSum(
    userId: string,
    transactional?: EntityManager,
  ): Promise<number> {
    return transactional
      ? transactional
          .sum(WalletEntity, 'sum', { userId })
          .then((sum) => sum ?? 0)
      : this.walletRepository.sum('sum', { userId }).then((sum) => sum ?? 0);
  }
}
