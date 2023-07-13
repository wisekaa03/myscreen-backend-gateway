import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { TypeOrmFind } from '@/shared/typeorm.find';
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
    return this.orderRepository.findAndCount(TypeOrmFind.Nullable(find));
  }

  async findOne(
    find: FindManyOptions<OrderEntity>,
  ): Promise<OrderEntity | null> {
    return this.orderRepository.findOne(TypeOrmFind.Nullable(find));
  }

  async create(
    user: UserEntity,
    sum: number,
    description?: string,
  ): Promise<OrderEntity> {
    const order: DeepPartial<OrderEntity> = {
      sum,
      description,
      user,
    };

    return this.orderRepository.save(this.orderRepository.create(order));
  }
}
