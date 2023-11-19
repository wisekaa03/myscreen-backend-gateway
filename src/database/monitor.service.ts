import {
  BadRequestException,
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, FindManyOptions, In, Repository } from 'typeorm';

import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { MonitorMultiple, MonitorStatus } from '@/enums';
import { MonitorMultipleRequest } from '@/dto';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MonitorEntity } from './monitor.entity';
import { MonitorFavoriteEntity } from './monitor.favorite.entity';
import { UserEntity } from './user.entity';
import { ApplicationService } from '@/database/application.service';
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

    if (find.relations !== undefined) {
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

    if (find.relations !== undefined) {
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

  async findOne({
    find,
    userId,
    caseInsensitive = true,
  }: {
    find: FindManyOptions<MonitorEntity>;
    userId?: string;
    caseInsensitive?: boolean;
  }): Promise<MonitorEntity | null> {
    let monitorWhere: FindManyOptions<MonitorEntity>;

    if (find.relations !== undefined) {
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

  async update(
    id: string,
    update: QueryDeepPartialEntity<MonitorEntity>,
    multipleIds?: MonitorMultipleRequest[],
  ): Promise<MonitorEntity> {
    const multipleBool = Array.isArray(multipleIds);

    const originalMonitor = await this.findOne({
      find: {
        where: { id },
        relations: multipleBool ? { multipleMonitors: { monitor: true } } : {},
        loadEagerRelations: false,
      },
    });
    if (!originalMonitor) {
      throw new NotFoundException(`Monitor "${id}" not found`);
    }
    if (originalMonitor.playlistId) {
      throw new BadRequestException(
        `Monitor "${originalMonitor.name}"#"${id}" is attached to the playlist`,
      );
    }
    if (originalMonitor.multiple === update.multiple) {
      throw new BadRequestException(
        `Monitor "${originalMonitor.name}"#"${id}" multiple not changed`,
      );
    }
    if (originalMonitor.multiple !== MonitorMultiple.SINGLE && multipleBool) {
      throw new BadRequestException(
        `Monitor "${originalMonitor.name}"#"${id}" group monitors ID is not empty`,
      );
    }

    return this.monitorRepository.manager.transaction(async (transact) => {
      const updated = await transact.update(MonitorEntity, id, update);
      if (!updated.affected) {
        throw new NotAcceptableException(`Monitor with this ${id} not found`);
      }
      const monitor = await this.findOne({
        find: { where: { id } },
        userId: originalMonitor.userId,
      });
      if (!monitor) {
        throw new NotFoundException(`Monitor with this ${id} not found`);
      }
      await this.applicationService.websocketChange({ monitor });

      // а тут начинается полный трэш
      if (originalMonitor.multiple !== MonitorMultiple.SINGLE && multipleBool) {
        // получаем подчиненные мониторы
        const { multipleMonitors } = originalMonitor;
        if (multipleMonitors) {
          const monitorsDeleteId = multipleMonitors.reduce(
            (acc, item) =>
              multipleIds.find(({ monitorId }) => monitorId === item.monitorId)
                ? acc
                : [...acc, item],
            [] as MonitorMultipleEntity[],
          );
          // удаляем из таблицы связей мониторов мониторы
          if (monitorsDeleteId.length > 0) {
            const monitorsWSchangePromise = monitorsDeleteId.map(
              async (item) => {
                this.applicationService.websocketChange({
                  monitor: item.monitor,
                  monitorDelete: true,
                });
              },
            );
            await Promise.all(monitorsWSchangePromise);

            await transact.delete(MonitorMultipleEntity, {
              parentMonitorId: originalMonitor.id,
              monitorId: In(monitorsDeleteId.map((item) => item.monitorId)),
            });
            // и помечаем монитор как одиночный
            await transact.update(
              MonitorEntity,
              { id: In(monitorsDeleteId.map((item) => item.monitorId)) },
              { multiple: MonitorMultiple.SINGLE },
            );
          }
          // обновляем мониторы в таблице связей мониторов
          const multipleInsertPromise = multipleIds.map(async (item) => {
            const monitorMultiple = multipleMonitors.find(
              (i) => i.monitorId === item.monitorId,
            );
            if (monitorMultiple) {
              await transact.update(
                MonitorMultipleEntity,
                {
                  parentMonitorId: originalMonitor.id,
                  monitorId: item.monitorId,
                },
                {
                  row: item.row,
                  col: item.col,
                },
              );
            } else {
              await transact.insert(MonitorMultipleEntity, {
                userId: originalMonitor.userId,
                parentMonitorId: originalMonitor.id,
                monitorId: item.monitorId,
                row: item.row,
                col: item.col,
              });
            }
            await transact.update(MonitorEntity, item.monitorId, {
              multiple: MonitorMultiple.SUBORDINATE,
            });
          });
          await Promise.all(multipleInsertPromise);
        }
      }

      return monitor;
    });
  }

  async create({
    user,
    insert,
    multipleIds,
  }: {
    user: UserEntity;
    insert: QueryDeepPartialEntity<MonitorEntity>;
    multipleIds?: MonitorMultipleRequest[];
  }) {
    if (insert.monitorInfo) {
      throw new BadRequestException('Monitor info deprecated');
    }
    const prepareMonitor: QueryDeepPartialEntity<MonitorEntity> = {
      ...insert,
      userId: user.id,
    };

    return this.monitorRepository.manager.transaction(async (transact) => {
      const monitorInserted =
        await this.monitorRepository.insert(prepareMonitor);
      if (!monitorInserted.raw.insertId) {
        throw new NotAcceptableException('Monitor not created');
      }
      const monitor = await this.findOne({
        find: { where: { id: monitorInserted.raw.insertId } },
        userId: user.id,
      });
      if (!monitor) {
        throw new NotAcceptableException('Monitor not created');
      }

      let groupMonitors: MonitorEntity[] = [];
      const multipleBool = Array.isArray(multipleIds) && multipleIds.length > 0;
      if (insert.multiple !== MonitorMultiple.SINGLE) {
        if (!multipleIds || multipleIds.length === 0) {
          throw new BadRequestException('Group monitors ID is empty');
        }

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
        if (insert.multiple === MonitorMultiple.SCALING) {
          const multipleRows = new Set<number>();
          const multipleCols = new Set<number>();
          multipleIds.forEach((item) => {
            if (multipleRows.has(item.row) && multipleCols.has(item.col)) {
              throw new BadRequestException(
                `Monitor multiple "${item.monitorId}": row "${item.row}" with col "${item.col}" is already occupied`,
              );
            }
            multipleRows.add(item.row);
            multipleCols.add(item.col);
          });
        }
      } else if (multipleBool) {
        throw new BadRequestException('Group monitors ID is not empty');
      }

      if (multipleBool) {
        const monitorMultiple = groupMonitors.map(async (groupMonitor) => {
          const groupMonitorId = groupMonitor.id;
          const item = multipleIds.find((i) => i.monitorId === groupMonitorId);
          if (!item) {
            throw new BadRequestException('Not found ID of some monitors');
          }

          // добавляем в таблицу связей мониторов монитор
          await transact.insert(MonitorMultipleEntity, {
            userId: user.id,
            parentMonitorId: monitor.id,
            monitorId: groupMonitorId,
            row: item.row,
            col: item.col,
          });

          // и помечаем монитор как подчиненный
          await transact.update(
            MonitorEntity,
            { id: groupMonitorId },
            {
              multiple: MonitorMultiple.SUBORDINATE,
            },
          );
        });

        await Promise.all(monitorMultiple);
      }

      return monitor;
    });
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
    const monitor = await this.findOne({
      userId: user.id,
      find: {
        where: { id: monitorId },
      },
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
      });
      if (!affected) {
        throw new NotFoundException('Monitor not found');
      }
    }

    return this.findOne({
      userId: user.id,
      find: {
        where: { id: monitorId },
        loadEagerRelations: false,
        relations: { favorities: true },
      },
    });
  }

  async delete(monitor: MonitorEntity): Promise<DeleteResult> {
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
          // TODO: заменить на Promise
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
    });
  }
}
