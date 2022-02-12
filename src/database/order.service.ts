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

  async find(
    find: FindManyOptions<OrderEntity>,
  ): Promise<[Array<OrderEntity>, number]> {
    return this.orderRepository.findAndCount(find);
  }

  async findOne(
    find: FindManyOptions<OrderEntity>,
  ): Promise<OrderEntity | undefined> {
    return this.orderRepository.findOne(find);
  }

  async create(user: UserEntity): Promise<OrderEntity> {
    const order: DeepPartial<OrderEntity> = {
      user,
    };

    return this.orderRepository.save(this.orderRepository.create(order));
  }
}
