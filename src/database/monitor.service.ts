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

  async find({
    userId,
    find,
    caseInsensitive = true,
  }: {
    userId: string;
    find: FindManyOptions<MonitorEntity>;
    caseInsensitive?: boolean;
  }): Promise<Array<MonitorEntity>> {
    let monitorWhere: FindManyOptions<MonitorEntity>;

    if (find.relations) {
      monitorWhere = TypeOrmFind.Nullable(find);
    } else {
      monitorWhere = {
        relations: { files: true, playlist: true, favorities: true },
        ...TypeOrmFind.Nullable(find),
      };
    }

    const monitor = caseInsensitive
      ? await TypeOrmFind.findCI(this.monitorRepository, monitorWhere)
      : await this.monitorRepository.find(monitorWhere);

    return monitor.map((item: MonitorEntity) => {
      const value = item;
      value.favorite =
        value.favorities?.some((i) => i.userId === userId) ?? false;
      delete value.favorities;
      return value;
    });
  }

  async count({
    find,
    caseInsensitive = true,
  }: {
    find: FindManyOptions<MonitorEntity>;
    caseInsensitive?: boolean;
  }): Promise<number> {
    const monitorWhere = TypeOrmFind.Nullable(find);
    const monitor = caseInsensitive
      ? await TypeOrmFind.countCI(this.monitorRepository, monitorWhere)
      : await this.monitorRepository.count(monitorWhere);

    return monitor;
  }

  async findAndCount({
    userId,
    find,
    caseInsensitive = true,
  }: {
    userId: string;
    find: FindManyOptions<MonitorEntity>;
    caseInsensitive?: boolean;
  }): Promise<[Array<MonitorEntity>, number]> {
    let monitorWhere: FindManyOptions<MonitorEntity>;

    if (find.relations) {
      monitorWhere = TypeOrmFind.Nullable(find);
    } else {
      monitorWhere = {
        relations: { files: true, playlist: true, favorities: true },
        ...TypeOrmFind.Nullable(find),
      };
    }

    const monitor = caseInsensitive
      ? await TypeOrmFind.findAndCountCI(this.monitorRepository, monitorWhere)
      : await this.monitorRepository.findAndCount(monitorWhere);

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
    caseInsensitive = true,
  ): Promise<MonitorEntity | null> {
    let monitorWhere: FindManyOptions<MonitorEntity>;

    if (find.relations) {
      monitorWhere = TypeOrmFind.Nullable(find);
    } else {
      monitorWhere = {
        relations: { files: true, playlist: true, favorities: true },
        ...TypeOrmFind.Nullable(find),
      };
    }

    const monitor = caseInsensitive
      ? await TypeOrmFind.findOneCI(this.monitorRepository, monitorWhere)
      : await this.monitorRepository.findOne(monitorWhere);

    if (monitor) {
      monitor.favorite =
        userId !== undefined
          ? monitor.favorities?.some((fav) => fav.userId === userId) ?? false
          : false;
      delete monitor.favorities;
    }

    return monitor;
  }

  async update({
    user,
    update,
    multipleIds,
  }: {
    user?: UserEntity;
    update: DeepPartial<MonitorEntity>;
    multipleIds?: MonitorMultipleRequest[];
  }): Promise<MonitorEntity> {
    if (update.monitorInfo) {
      throw new BadRequestException('Monitor info deprecated');
    }
    const monitorUpdate: DeepPartial<MonitorEntity> = user
      ? {
          userId: user.id,
          ...update,
        }
      : update;
    if (monitorUpdate.id === undefined) {
      throw new BadRequestException('Monitor ID is empty');
    }

    const multipleBool = Array.isArray(multipleIds);

    if (update.multiple !== MonitorMultiple.SINGLE) {
      let groupMonitors: MonitorEntity[] = [];

      const monitorFind = await this.monitorRepository.findOne({
        where: { id: monitorUpdate.id },
        relations: multipleBool ? { multipleMonitors: true } : {},
      });
      if (!monitorFind) {
        throw new NotFoundException('Monitor not found');
      }
      if (multipleBool) {
        const multipleMonitorIds = multipleIds.map((item) => item.monitorId);
        groupMonitors = await this.monitorRepository.find({
          where: {
            id: In(multipleMonitorIds),
            multiple: MonitorMultiple.SINGLE,
          },
          select: ['id'],
        });
        if (
          Array.isArray(groupMonitors) &&
          groupMonitors.length !== multipleIds.length
        ) {
          throw new BadRequestException('Not found ID of some monitors');
        }
      }

      return this.monitorRepository.manager.transaction(async (transact) => {
        const monitor = await transact.save(
          MonitorEntity,
          transact.create(MonitorEntity, monitorUpdate),
        );

        if (multipleBool) {
          const monitorMultiplePromise = groupMonitors.map(
            async (groupMonitor) => {
              const groupMonitorId = groupMonitor.id;
              const itemMonitor = multipleIds.find((item) => {
                const monitorFindIndex =
                  monitorFind.multipleMonitors?.findIndex(
                    (i) => i.monitorId === groupMonitorId,
                  );
                if (monitorFindIndex !== undefined) {
                  delete monitorFind.multipleMonitors?.[monitorFindIndex];
                }
                return item.monitorId === groupMonitorId;
              });
              if (!itemMonitor) {
                throw new BadRequestException('Not found ID of some monitors');
              }
              await transact.save(
                MonitorMultipleEntity,
                transact.create(MonitorMultipleEntity, {
                  userId: user?.id ?? monitor.userId,
                  parentMonitorId: monitor.id,
                  monitorId: groupMonitorId,
                  multipleRowNo: itemMonitor.multipleRowNo,
                  multipleColNo: itemMonitor.multipleColNo,
                }),
              );
              await transact.update(
                MonitorEntity,
                { id: groupMonitorId },
                {
                  multiple: MonitorMultiple.SUBORDINATE,
                },
              );
            },
          );
          await Promise.all(monitorMultiplePromise);

          const monitorMultipleDeletePromise =
            monitorFind.multipleMonitors?.map(async (item) => {
              await transact.delete(MonitorMultipleEntity, {
                parentMonitorId: monitor.id,
                monitorId: item.monitorId,
              });
              await transact.update(
                MonitorEntity,
                { id: item.monitorId },
                {
                  multiple: MonitorMultiple.SINGLE,
                },
              );
            });
          if (Array.isArray(monitorMultipleDeletePromise)) {
            await Promise.all(monitorMultipleDeletePromise);
          }
        }

        return monitor;
      });
    }

    if (multipleIds && multipleIds.length > 0) {
      throw new BadRequestException('Group monitors ID is not empty');
    }

    return this.monitorRepository.save(
      this.monitorRepository.create(monitorUpdate),
    );
  }

  async create({
    user,
    update,
    multipleIds,
  }: {
    user: UserEntity;
    update: Partial<MonitorEntity>;
    multipleIds?: MonitorMultipleRequest[];
  }) {
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
        },
        select: ['id'],
      });
      if (
        Array.isArray(groupMonitors) &&
        groupMonitors.length !== multipleIds.length
      ) {
        throw new BadRequestException('Not found ID of some monitors');
      }

      return this.monitorRepository.manager.transaction(async (transact) => {
        const monitor = await transact.save(
          MonitorEntity,
          transact.create(MonitorEntity, prepareMonitor),
        );

        const monitorMultiple = groupMonitors.map(async (groupMonitor) => {
          const groupMonitorId = groupMonitor.id;
          const item = multipleIds.find((i) => i.monitorId === groupMonitorId);
          if (!item) {
            throw new BadRequestException('Not found ID of some monitors');
          }
          await transact.save(
            MonitorMultipleEntity,
            transact.create(MonitorMultipleEntity, {
              userId: user.id,
              parentMonitorId: monitor.id,
              monitorId: groupMonitorId,
              multipleRowNo: item.multipleRowNo,
              multipleColNo: item.multipleColNo,
            }),
          );
          await transact.update(
            MonitorEntity,
            { id: groupMonitorId },
            {
              multiple: MonitorMultiple.SUBORDINATE,
            },
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

    if (monitor.multiple !== MonitorMultiple.SINGLE) {
      return this.monitorRepository.manager.transaction(async (transact) => {
        const monitorMultiple = await transact.find(MonitorMultipleEntity, {
          where: {
            parentMonitorId: monitor.id,
          },
        });
        if (monitorMultiple.length > 0) {
          const monitorIdsPromise = monitorMultiple.map(async (item) => {
            await this.applicationService.websocketChange({
              monitor: item.monitor,
              monitorDelete: true,
            });
            return item.monitorId;
          });
          const monitorIds = await Promise.all(monitorIdsPromise);
          await transact.update(
            MonitorEntity,
            { id: In(monitorIds) },
            { multiple: MonitorMultiple.SINGLE },
          );
          await transact.delete(MonitorMultipleEntity, {
            parentMonitorId: monitor.id,
          });
        }

        return transact.delete(MonitorEntity, { id: monitor.id });
      });
    }

    return this.monitorRepository.delete({
      id: monitor.id,
      userId,
    });
  }
}
