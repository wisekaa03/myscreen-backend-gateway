import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { StatisticsEntity } from './statistics.entity';

@Injectable()
export class StatisticsService {
  private logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(StatisticsEntity)
    private readonly statisticsRepository: Repository<StatisticsEntity>,
  ) {}

  async find(
    find: FindManyOptionsExt<StatisticsEntity>,
  ): Promise<StatisticsEntity[]> {
    return !find.caseInsensitive
      ? this.statisticsRepository.find(
          TypeOrmFind.findParams(StatisticsEntity, find),
        )
      : TypeOrmFind.findCI(
          this.statisticsRepository,
          TypeOrmFind.findParams(StatisticsEntity, find),
        );
  }

  async findAndCount(
    find: FindManyOptionsExt<StatisticsEntity>,
  ): Promise<[StatisticsEntity[], number]> {
    return !find.caseInsensitive
      ? this.statisticsRepository.findAndCount(
          TypeOrmFind.findParams(StatisticsEntity, find),
        )
      : TypeOrmFind.findAndCountCI(
          this.statisticsRepository,
          TypeOrmFind.findParams(StatisticsEntity, find),
        );
  }

  async findOne(
    find: FindOneOptionsExt<StatisticsEntity>,
  ): Promise<StatisticsEntity | null> {
    return !find.caseInsensitive
      ? this.statisticsRepository.findOne(
          TypeOrmFind.findParams(StatisticsEntity, find),
        )
      : TypeOrmFind.findOneCI(
          this.statisticsRepository,
          TypeOrmFind.findParams(StatisticsEntity, find),
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
  }): Promise<StatisticsEntity> {
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
