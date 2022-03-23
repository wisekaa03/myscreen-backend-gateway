import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';

import { UptimeMonitoringEntity } from './uptime-monitoring.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class UptimeMonitoringService {
  constructor(
    @InjectRepository(UptimeMonitoringEntity)
    private readonly uptimeMonitoringEntity: Repository<UptimeMonitoringEntity>,
  ) {}

  async find(
    find: FindManyOptions<UptimeMonitoringEntity>,
  ): Promise<[Array<UptimeMonitoringEntity>, number]> {
    return this.uptimeMonitoringEntity.findAndCount(find);
  }

  async findOne(
    find: FindManyOptions<UptimeMonitoringEntity>,
  ): Promise<UptimeMonitoringEntity | null> {
    return this.uptimeMonitoringEntity.findOne(find);
  }

  async create(user: UserEntity): Promise<UptimeMonitoringEntity> {
    const uptimeMonitoring: DeepPartial<UptimeMonitoringEntity> = {
      user,
    };

    return this.uptimeMonitoringEntity.save(
      this.uptimeMonitoringEntity.create(uptimeMonitoring),
    );
  }
}
