import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  In,
  IsNull,
  Repository,
} from 'typeorm';

import { MonitorMultiple, MonitorStatus } from '@/enums';
import { MonitorMultipleRequest } from '@/dto';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MonitorEntity } from './monitor.entity';
import { MonitorFavoriteEntity } from './monitor.favorite.entity';
import { UserEntity } from './user.entity';
// eslint-disable-next-line import/no-cycle
import { ApplicationService } from './application.service';
import { MonitorMultipleEntity } from './monitor.multiple.entity';

@Injectable()
export class MonitorService {
  constructor(
    @Inject(forwardRef(() => ApplicationService))
    private readonly applicationService: ApplicationService,
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
    @InjectRepository(MonitorMultipleEntity)
    private readonly monitorMultipleRepository: Repository<MonitorMultipleEntity>,
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
    userId: string | undefined,
    find: FindManyOptions<MonitorEntity>,
  ): Promise<MonitorEntity | null> {
    const monitor = await this.monitorRepository.findOne({
      relations: ['files', 'playlist', 'favorities'],
      ...TypeOrmFind.Nullable(find),
    });
    if (monitor) {
      monitor.favorite =
        userId !== undefined
          ? monitor.favorities?.some((fav) => fav.userId === userId) ?? false
          : false;
      delete monitor.favorities;
    }

    return monitor;
  }

  async update(
    user: UserEntity,
    update: Partial<MonitorEntity>,
    multipleIds?: MonitorMultipleRequest[],
  ): Promise<MonitorEntity> {
    const prepareMonitor: DeepPartial<MonitorEntity> = {
      userId: user.id,
      ...update,
    };

    if (update.multiple !== MonitorMultiple.SINGLE) {
      if (!multipleIds || multipleIds.length === 0) {
        throw new BadRequestException('Group monitors ID is empty');
      }

      const multipleMonitorIds = multipleIds.map((item) => item.monitorId);
      const groupMonitors = await this.monitorRepository.find({
        where: {
          id: In(multipleMonitorIds),
          multiple: MonitorMultiple.SINGLE,
          multipleMonitors: IsNull(),
        },
        select: ['id'],
      });
      if (!groupMonitors || groupMonitors.length === multipleIds.length) {
        throw new BadRequestException('Not found ID of some monitors');
      }

      return this.monitorRepository.manager.transaction(async (transact) => {
        const monitor = await transact.save(
          MonitorEntity,
          transact.create(MonitorEntity, prepareMonitor),
        );

        const monitorMultiple = groupMonitors.map(async (groupMonitor) => {
          const monitorId = groupMonitor.id;
          const item = multipleIds.find((i) => i.monitorId === monitorId);
          if (!item) {
            throw new BadRequestException('Not found ID of some monitors');
          }
          await transact.save(
            MonitorMultipleEntity,
            transact.create(MonitorMultipleEntity, {
              userId: user.id,
              parentMonitorId: monitor.id,
              monitorId,
              multipleRowNo: item.multipleRowNo,
              multipleColNo: item.multipleColNo,
            }),
          );
        });

        await Promise.all(monitorMultiple);

        return monitor;
      });
    }

    if (multipleIds && multipleIds.length > 0) {
      throw new BadRequestException('Group monitors ID is not empty');
    }

    return this.monitorRepository.save(
      this.monitorRepository.create(prepareMonitor),
    );
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
    user: UserEntity,
    monitorId: string,
    favorite = true,
  ): Promise<MonitorEntity | null> {
    const monitor = await this.findOne(user.id, {
      where: { id: monitorId },
    });
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }
    if (favorite && !monitor.favorite) {
      const insertResult = await this.monitorFavoriteRepository.insert({
        monitorId,
        userId: user.id,
      });
      if (!insertResult) {
        throw new NotFoundException('Monitor not found');
      }
    } else if (!favorite && monitor.favorite) {
      const { affected } = await this.monitorFavoriteRepository.delete({
        monitorId: monitor.id,
        userId: user.id,
      });
      if (!affected) {
        throw new NotFoundException('Monitor not found');
      }
    }

    return this.findOne(user.id, { where: { id: monitorId } });
  }

  async delete(userId: string, monitor: MonitorEntity): Promise<DeleteResult> {
    await this.applicationService.websocketChange({
      monitor,
      monitorDelete: true,
    });

    return this.monitorRepository.delete({
      id: monitor.id,
      userId,
    });
  }
}
