import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { MonitorEntity } from './monitor.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
    private readonly configService: ConfigService,
  ) {}

  find = async (
    find: FindManyOptions<MonitorEntity>,
  ): Promise<[Array<MonitorEntity>, number]> =>
    this.monitorRepository.findAndCount(find);

  findOne = async (
    find: FindManyOptions<MonitorEntity>,
  ): Promise<MonitorEntity | undefined> => this.monitorRepository.findOne(find);

  async create(
    user: UserEntity,
    monitor: Partial<MonitorEntity>,
  ): Promise<MonitorEntity> {
    const order: DeepPartial<MonitorEntity> = {
      userId: user.id,
      ...monitor,
    };

    return this.monitorRepository.save(this.monitorRepository.create(order));
  }
}
