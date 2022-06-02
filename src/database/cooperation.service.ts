import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { CooperationEntity } from './cooperation.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class CooperationService {
  constructor(
    @InjectRepository(CooperationEntity)
    private readonly cooperationRepository: Repository<CooperationEntity>,
  ) {}

  async find(
    find: FindManyOptions<CooperationEntity>,
  ): Promise<[Array<CooperationEntity>, number]> {
    return this.cooperationRepository.findAndCount(find);
  }

  async findOne(
    find: FindManyOptions<CooperationEntity>,
  ): Promise<CooperationEntity | null> {
    return this.cooperationRepository.findOne(find);
  }

  async create(user: UserEntity): Promise<CooperationEntity> {
    const order: DeepPartial<CooperationEntity> = {
      user,
    };

    return this.cooperationRepository.save(
      this.cooperationRepository.create(order),
    );
  }
}
