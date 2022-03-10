import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import {
  findOrderByCaseInsensitive,
  findOrderByCaseInsensitiveCount,
} from '@/shared/select-order-case-insensitive';
import { MonitorEntity } from './monitor.entity';
import { MonitorStatus } from '@/enums';

@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
  ) {}

  async find(
    find: FindManyOptions<MonitorEntity>,
    caseInsensitive = true,
  ): Promise<Array<MonitorEntity>> {
    return caseInsensitive
      ? findOrderByCaseInsensitive(this.monitorRepository, {
          relations: ['files', 'playlist'],
          ...find,
        })
      : this.monitorRepository.find({
          relations: ['files', 'playlist'],
          ...find,
        });
  }

  async findAndCount(
    find: FindManyOptions<MonitorEntity>,
    caseInsensitive = true,
  ): Promise<[Array<MonitorEntity>, number]> {
    return caseInsensitive
      ? findOrderByCaseInsensitiveCount(this.monitorRepository, {
          relations: ['files', 'playlist'],
          ...find,
        })
      : this.monitorRepository.findAndCount({
          relations: ['files', 'playlist'],
          ...find,
        });
  }

  async findOne(
    find: FindManyOptions<MonitorEntity>,
  ): Promise<MonitorEntity | undefined> {
    return this.monitorRepository.findOne({
      relations: ['files', 'playlist'],
      ...find,
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
      { status: MonitorStatus.Offline },
      { status },
    );
  }

  async delete(userId: string, monitor: MonitorEntity): Promise<DeleteResult> {
    return this.monitorRepository.delete({
      id: monitor.id,
      userId,
    });
  }
}
