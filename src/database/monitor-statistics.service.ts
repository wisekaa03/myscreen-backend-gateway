import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MonitorStatisticsEntity } from './monitor-statistics.entity';

@Injectable()
export class MonitorStatisticsService {
  private logger = new Logger(MonitorStatisticsService.name);

  constructor(
    @InjectRepository(MonitorStatisticsEntity)
    private readonly statisticsRepository: Repository<MonitorStatisticsEntity>,
  ) {}

  async find(
    find: FindManyOptionsExt<MonitorStatisticsEntity>,
  ): Promise<MonitorStatisticsEntity[]> {
    return !find.caseInsensitive
      ? this.statisticsRepository.find(
          TypeOrmFind.findParams(MonitorStatisticsEntity, find),
        )
      : TypeOrmFind.findCI(
          this.statisticsRepository,
          TypeOrmFind.findParams(MonitorStatisticsEntity, find),
        );
  }

  async findAndCount(
    find: FindManyOptionsExt<MonitorStatisticsEntity>,
  ): Promise<[MonitorStatisticsEntity[], number]> {
    return !find.caseInsensitive
      ? this.statisticsRepository.findAndCount(
          TypeOrmFind.findParams(MonitorStatisticsEntity, find),
        )
      : TypeOrmFind.findAndCountCI(
          this.statisticsRepository,
          TypeOrmFind.findParams(MonitorStatisticsEntity, find),
        );
  }

  async findOne(
    find: FindOneOptionsExt<MonitorStatisticsEntity>,
  ): Promise<MonitorStatisticsEntity | null> {
    return !find.caseInsensitive
      ? this.statisticsRepository.findOne(
          TypeOrmFind.findParams(MonitorStatisticsEntity, find),
        )
      : TypeOrmFind.findOneCI(
          this.statisticsRepository,
          TypeOrmFind.findParams(MonitorStatisticsEntity, find),
        );
  }

  async create({
    monitorId,
    playlistId,
    playlistPlayed,
    userId,
  }: {
    monitorId: string;
    playlistId: string;
    playlistPlayed: boolean;
    userId: string;
  }): Promise<MonitorStatisticsEntity> {
    return this.statisticsRepository.save(
      this.statisticsRepository.create({
        monitorId,
        playlistId,
        playlistPlayed,
        userId,
      }),
    );
  }
}
