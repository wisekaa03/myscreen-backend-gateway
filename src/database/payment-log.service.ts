import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { PaymentLogEntity } from './payment-log.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class PaymentLogService {
  constructor(
    @InjectRepository(PaymentLogEntity)
    private readonly paymentLogRepository: Repository<PaymentLogEntity>,
  ) {}

  find = async (
    find: FindManyOptions<PaymentLogEntity>,
  ): Promise<[Array<PaymentLogEntity>, number]> =>
    this.paymentLogRepository.findAndCount(find);

  findOne = async (
    find: FindManyOptions<PaymentLogEntity>,
  ): Promise<PaymentLogEntity | undefined> =>
    this.paymentLogRepository.findOne(find);

  async create(user: UserEntity): Promise<PaymentLogEntity> {
    const order: DeepPartial<PaymentLogEntity> = {
      user,
    };

    return this.paymentLogRepository.save(
      this.paymentLogRepository.create(order),
    );
  }
}
