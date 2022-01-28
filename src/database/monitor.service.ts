import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { MonitorEntity } from './monitor.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
  ) {}

  find = async (
    find: FindManyOptions<MonitorEntity>,
  ): Promise<[Array<MonitorEntity>, number]> =>
    this.monitorRepository.findAndCount({
      relations: ['files', 'playlist'],
      ...find,
    });

  findOne = async (
    find: FindManyOptions<MonitorEntity>,
  ): Promise<MonitorEntity | undefined> =>
    this.monitorRepository.findOne({
      relations: ['files', 'playlist'],
      ...find,
    });

  async update(
    user: UserEntity,
    monitor: Partial<MonitorEntity>,
  ): Promise<MonitorEntity> {
    const order: DeepPartial<MonitorEntity> = {
      userId: user.id,
      ...monitor,
    };

    return this.monitorRepository.save(this.monitorRepository.create(order));
  }

  async delete(
    user: UserEntity,
    monitor: MonitorEntity,
  ): Promise<DeleteResult> {
    return this.monitorRepository.delete({
      id: monitor.id,
      userId: user.id,
    });
  }
}
