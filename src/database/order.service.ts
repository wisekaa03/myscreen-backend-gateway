import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { OrderEntity } from './order.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  find = async (
    find: FindManyOptions<OrderEntity>,
  ): Promise<[Array<OrderEntity>, number]> =>
    this.orderRepository.findAndCount(find);

  findOne = async (
    find: FindManyOptions<OrderEntity>,
  ): Promise<OrderEntity | undefined> => this.orderRepository.findOne(find);

  async create(user: UserEntity): Promise<OrderEntity> {
    const order: DeepPartial<OrderEntity> = {
      user,
    };

    return this.orderRepository.save(this.orderRepository.create(order));
  }
}
