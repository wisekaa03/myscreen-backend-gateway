import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { PaymentEntity } from './payment.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  find = async (
    find: FindManyOptions<PaymentEntity>,
  ): Promise<[Array<PaymentEntity>, number]> =>
    this.paymentRepository.findAndCount(find);

  findOne = async (
    find: FindManyOptions<PaymentEntity>,
  ): Promise<PaymentEntity | undefined> => this.paymentRepository.findOne(find);

  async create(user: UserEntity): Promise<PaymentEntity> {
    const order: DeepPartial<PaymentEntity> = {
      user,
    };

    return this.paymentRepository.save(this.paymentRepository.create(order));
  }
}
