import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import { MonitorStatus } from '@/enums';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MonitorOnlineEntity } from './monitor-online.entity';

@Injectable()
export class MonitorOnlineService {
  private logger = new Logger(MonitorOnlineService.name);

  constructor(
    @InjectRepository(MonitorOnlineEntity)
    private readonly monitorOnlineRepository: Repository<MonitorOnlineEntity>,
  ) {}

  async find(
    find: FindManyOptionsExt<MonitorOnlineEntity>,
  ): Promise<MonitorOnlineEntity[]> {
    return !find.caseInsensitive
      ? this.monitorOnlineRepository.find(
          TypeOrmFind.findParams(MonitorOnlineEntity, find),
        )
      : TypeOrmFind.findCI(
          this.monitorOnlineRepository,
          TypeOrmFind.findParams(MonitorOnlineEntity, find),
        );
  }

  async findAndCount(
    find: FindManyOptionsExt<MonitorOnlineEntity>,
  ): Promise<[MonitorOnlineEntity[], number]> {
    return !find.caseInsensitive
      ? this.monitorOnlineRepository.findAndCount(
          TypeOrmFind.findParams(MonitorOnlineEntity, find),
        )
      : TypeOrmFind.findAndCountCI(
          this.monitorOnlineRepository,
          TypeOrmFind.findParams(MonitorOnlineEntity, find),
        );
  }

  async findOne(
    find: FindOneOptionsExt<MonitorOnlineEntity>,
  ): Promise<MonitorOnlineEntity | null> {
    return !find.caseInsensitive
      ? this.monitorOnlineRepository.findOne(
          TypeOrmFind.findParams(MonitorOnlineEntity, find),
        )
      : TypeOrmFind.findOneCI(
          this.monitorOnlineRepository,
          TypeOrmFind.findParams(MonitorOnlineEntity, find),
        );
  }

  async create({
    monitorId,
    status,
    userId,
  }: {
    monitorId: string;
    status: MonitorStatus;
    userId: string;
  }): Promise<MonitorOnlineEntity> {
    return this.monitorOnlineRepository.save(
      this.monitorOnlineRepository.create({
        monitorId,
        status,
        userId,
      }),
    );
  }
}
