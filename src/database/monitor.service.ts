import { Injectable, NotFoundException } from '@nestjs/common';
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
import { MonitorFavoriteEntity } from './monitor.favorite.entity';

@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
    @InjectRepository(MonitorFavoriteEntity)
    private readonly monitorFavoriteRepository: Repository<MonitorFavoriteEntity>,
  ) {}

  async find(
    userId: string,
    find: FindManyOptions<MonitorEntity>,
    caseInsensitive = true,
  ): Promise<Array<MonitorEntity>> {
    const monitor = caseInsensitive
      ? await TypeOrmFind.findCI(this.monitorRepository, {
          relations: ['files', 'playlist', 'favorities'],
          ...TypeOrmFind.Nullable(find),
        })
      : await this.monitorRepository.find({
          relations: ['files', 'playlist', 'favorities'],
          ...TypeOrmFind.Nullable(find),
        });

    return monitor.map((item: MonitorEntity) => {
      const value = item;
      value.favorite =
        value.favorities?.some((i) => i.userId === userId) ?? false;
      delete value.favorities;
      return value;
    });
  }

  async findAndCount(
    userId: string,
    find: FindManyOptions<MonitorEntity>,
    caseInsensitive = true,
  ): Promise<[Array<MonitorEntity>, number]> {
    const monitor = caseInsensitive
      ? await TypeOrmFind.findAndCountCI(this.monitorRepository, {
          relations: ['files', 'playlist', 'favorities'],
          ...TypeOrmFind.Nullable(find),
        })
      : await this.monitorRepository.findAndCount({
          relations: ['files', 'playlist', 'favorities'],
          ...TypeOrmFind.Nullable(find),
        });

    return [
      monitor[0].map((item: MonitorEntity) => {
        const value = item;
        value.favorite =
          value.favorities?.some((i) => i.userId === userId) ?? false;
        delete value.favorities;
        return value;
      }),
      monitor[1],
    ];
  }

  async findOne(
    userId: string,
    find: FindManyOptions<MonitorEntity>,
  ): Promise<MonitorEntity | null> {
    const monitor = await this.monitorRepository.findOne({
      relations: ['files', 'playlist', 'favorities'],
      ...TypeOrmFind.Nullable(find),
    });
    if (monitor) {
      monitor.favorite =
        monitor.favorities?.some((value) => value.userId === userId) ?? false;
      delete monitor.favorities;
    }

    return monitor;
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
  ): Promise<MonitorEntity | null> {
    const monitor = await this.findOne(userId, {
      where: { id: monitorId },
    });
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }
    if (favorite && !monitor.favorite) {
      const insertResult = await this.monitorFavoriteRepository.insert({
        monitorId,
        userId,
      });
      if (!insertResult) {
        throw new NotFoundException('Monitor not found');
      }
    } else if (!favorite && monitor.favorite) {
      const { affected } = await this.monitorFavoriteRepository.delete({
        monitorId: monitor.id,
        userId,
      });
      if (!affected) {
        throw new NotFoundException('Monitor not found');
      }
    }

    return this.findOne(userId, { where: { id: monitorId } });
  }

  async delete(userId: string, id: string): Promise<DeleteResult> {
    return this.monitorRepository.delete({
      id,
      userId,
    });
  }
}
