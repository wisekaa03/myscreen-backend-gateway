import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  Repository,
} from 'typeorm';

import { TypeOrmFind } from '@/shared/type-orm-find';
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
  ): Promise<[Array<MonitorEntity>, number]> {
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
    find: FindManyOptions<MonitorEntity>,
  ): Promise<MonitorEntity | null> {
    return this.monitorRepository.findOne({
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
