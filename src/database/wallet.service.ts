import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { UserEntity } from './user.entity';
import { ActEntity } from './act.entity';
import { InvoiceEntity } from './invoice.entity';
import { WalletEntity } from './wallet.entity';

@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);

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

  create({
    user,
    invoice,
    act,
  }: {
    user: UserEntity;
    invoice?: InvoiceEntity;
    act?: ActEntity;
  }): WalletEntity {
    const wallet: DeepPartial<WalletEntity> = {
      sum: (invoice?.sum ?? 0) - (act?.sum ?? 0),
      invoice,
      act,
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

  async calculateBalance(): Promise<void> {
    this.logger.warn('Wallet service is calculating balance...');
  }
}
