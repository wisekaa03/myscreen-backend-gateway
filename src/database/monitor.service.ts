import { Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { MonitorStatus } from '../enums/monitor-status.enum';
import { TypeOrmFind } from '../shared/typeorm.find';
import { MonitorEntity } from './monitor.entity';
import { MonitorViewEntity } from './monitor.view.entity';

@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
    @InjectRepository(MonitorViewEntity)
    private readonly monitorViewRepository: Repository<MonitorViewEntity>,
  ) {}

  async find(
    find: FindManyOptions<MonitorEntity>,
    caseInsensitive = true,
  ): Promise<Array<MonitorViewEntity>> {
    return caseInsensitive
      ? TypeOrmFind.findCI(this.monitorRepository, {
          relations: ['files', 'playlist'],
          ...TypeOrmFind.Nullable(find),
        })
      : this.monitorRepository.find({
          relations: ['files', 'playlist'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  async findAndCount(
    find: FindManyOptions<MonitorEntity>,
    caseInsensitive = true,
  ): Promise<[Array<MonitorViewEntity>, number]> {
    return caseInsensitive
      ? TypeOrmFind.findAndCountCI(this.monitorRepository, {
          relations: ['files', 'playlist'],
          ...TypeOrmFind.Nullable(find),
        })
      : this.monitorRepository.findAndCount({
          relations: ['files', 'playlist'],
          ...TypeOrmFind.Nullable(find),
        });
  }

  async findOne(
    find: FindManyOptions<MonitorViewEntity>,
  ): Promise<MonitorViewEntity | null> {
    return this.monitorViewRepository.findOne({
      relations: ['files', 'playlist'],
      ...TypeOrmFind.Nullable(find),
    });
  }

  async update(
    userId: string,
    monitor: Partial<MonitorEntity>,
  ): Promise<MonitorEntity> {
    const order: DeepPartial<MonitorEntity> = {
      userId,
      ...monitor,
    };

    return this.monitorRepository.save(this.monitorRepository.create(order));
  }

  async attached(attached = true): Promise<void> {
    await this.monitorRepository.update({ attached: true }, { attached });
  }

  async status(status = MonitorStatus.Online): Promise<void> {
    await this.monitorRepository.update(
      {
        status:
          status === MonitorStatus.Online
            ? MonitorStatus.Offline
            : MonitorStatus.Online,
      },
      {
        status:
          status === MonitorStatus.Online
            ? MonitorStatus.Online
            : MonitorStatus.Offline,
      },
    );
  }

  async favorite(
    userId: string,
    monitorId: string,
    favorite = true,
  ): Promise<MonitorViewEntity> {
    throw new NotImplementedException();
  }

  async delete(userId: string, id: string): Promise<DeleteResult> {
    return this.monitorRepository.delete({
      id,
      userId,
    });
  }
}
