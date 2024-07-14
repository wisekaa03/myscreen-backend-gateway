import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindManyOptions,
  In,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';

import { FindManyOptionsCaseInsensitive } from '@/interfaces';
import { BadRequestError, NotAcceptableError, NotFoundError } from '@/errors';
import { MonitorMultiple, MonitorStatus } from '@/enums';
import { MonitorGroup } from '@/dto/request/monitor-group';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MonitorEntity } from './monitor.entity';
import { MonitorFavoriteEntity } from './monitor.favorite.entity';
import { UserEntity } from './user.entity';
import { BidService } from '@/database/bid.service';
import { MonitorGroupEntity } from './monitor.group.entity';
import { WalletService } from './wallet.service';

@Injectable()
export class MonitorService {
  private logger = new Logger(MonitorService.name);

  constructor(
    private readonly bidService: BidService,
    private readonly walletService: WalletService,
    @InjectRepository(MonitorEntity)
    public readonly monitorRepository: Repository<MonitorEntity>,
    @InjectRepository(MonitorGroupEntity)
    public readonly monitorGroupRepository: Repository<MonitorGroupEntity>,
    @InjectRepository(MonitorFavoriteEntity)
    public readonly monitorFavoriteRepository: Repository<MonitorFavoriteEntity>,
  ) {}

  async find({
    userId,
    find,
    caseInsensitive = true,
  }: {
    userId: string;
    find: FindManyOptions<MonitorEntity>;
    caseInsensitive?: boolean;
  }): Promise<MonitorEntity[]> {
    let monitorWhere: FindManyOptions<MonitorEntity>;

    if (find.relations !== undefined) {
      monitorWhere = {
        ...find,
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    } else {
      monitorWhere = {
        relations: { files: true, playlist: true, favorities: true },
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    }

    const monitor = caseInsensitive
      ? await TypeOrmFind.findCI(this.monitorRepository, monitorWhere)
      : await this.monitorRepository.find(monitorWhere);

    return monitor && userId !== undefined
      ? monitor.map((item: MonitorEntity) => {
          const value = item;
          value.favorite =
            value.favorities?.some((i) => i.userId === userId) ?? false;
          delete value.favorities;
          return value;
        })
      : monitor;
  }

  async count(
    find: FindManyOptionsCaseInsensitive<MonitorEntity>,
  ): Promise<number> {
    const monitorWhere = TypeOrmFind.findParams(MonitorEntity, find);
    const monitor = find.caseInsensitive
      ? await TypeOrmFind.countCI(this.monitorRepository, monitorWhere)
      : await this.monitorRepository.count(monitorWhere);

    return monitor;
  }

  async countMonitors(userId: string): Promise<number> {
    return this.count({
      where: {
        userId,
        multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
      },
      caseInsensitive: false,
      loadEagerRelations: false,
      relations: {},
    });
  }

  async findAndCount({
    userId,
    find,
  }: {
    userId: string;
    find: FindManyOptionsCaseInsensitive<MonitorEntity>;
  }): Promise<[MonitorEntity[], number]> {
    let monitorWhere: FindManyOptions<MonitorEntity>;

    if (find.relations !== undefined) {
      monitorWhere = {
        ...find,
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    } else {
      monitorWhere = {
        relations: {
          files: true,
          playlist: true,
          favorities: true,
          groupMonitors: true,
        },
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    }

    let monitors: MonitorEntity[] = [];
    let count = 0;
    if (!find.caseInsensitive) {
      [monitors, count] =
        await this.monitorRepository.findAndCount(monitorWhere);
    } else {
      [monitors, count] = await TypeOrmFind.findAndCountCI(
        this.monitorRepository,
        monitorWhere,
      );
    }

    if (monitors) {
      if (userId !== undefined) {
        monitors = monitors.map((monitor: MonitorEntity) => {
          const value = monitor;
          value.favorite =
            value.favorities?.some((f) => f.userId === userId) ?? false;
          delete value.favorities;
          return value;
        });
      }

      monitors = monitors.map((monitor: MonitorEntity) => {
        const value = monitor;
        if (value.groupMonitors) {
          value.groupIds = value.groupMonitors.map(
            (group: MonitorGroupEntity) => ({
              monitorId: group.monitorId,
              row: group.row,
              col: group.col,
            }),
          );
          delete value.groupMonitors;
        }
        return value;
      });
    }

    return [monitors, count];
  }

  async findOne({
    find,
    userId,
  }: {
    find: FindManyOptionsCaseInsensitive<MonitorEntity>;
    userId?: string;
  }): Promise<MonitorEntity | null> {
    let monitorWhere: FindManyOptions<MonitorEntity>;

    if (find.relations !== undefined) {
      monitorWhere = {
        ...find,
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    } else {
      monitorWhere = {
        relations: {
          files: true,
          playlist: true,
          favorities: true,
          groupMonitors: true,
        },
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    }

    const monitor = !find.caseInsensitive
      ? await this.monitorRepository.findOne(monitorWhere)
      : await TypeOrmFind.findOneCI(this.monitorRepository, monitorWhere);

    if (monitor) {
      if (userId !== undefined) {
        monitor.favorite =
          userId !== undefined
            ? (monitor.favorities?.some((fav) => fav.userId === userId) ??
              false)
            : false;
        delete monitor.favorities;
      }
      if (monitor.groupMonitors) {
        monitor.groupIds = monitor.groupMonitors.map((item) => ({
          monitorId: item.monitorId,
          row: item.row,
          col: item.col,
        }));
        delete monitor.groupMonitors;
      }
    }

    return monitor;
  }

  async update(
    id: string,
    update: Partial<MonitorEntity>,
    groupIds?: MonitorGroup[],
  ): Promise<MonitorEntity> {
    const multipleBool = Array.isArray(groupIds);

    const originalMonitor = await this.findOne({
      find: {
        where: { id },
        relations: multipleBool ? { groupMonitors: { monitor: true } } : {},
        loadEagerRelations: false,
      },
    });
    if (!originalMonitor) {
      throw new NotFoundError(`Monitor '${id}' not found`);
    }
    const { userId, multiple = MonitorMultiple.SINGLE } = originalMonitor;
    const { multiple: updateMultiple = multiple } = update;
    if (multiple !== updateMultiple && multiple !== MonitorMultiple.SINGLE) {
      throw new BadRequestError(
        `Monitor '${originalMonitor.name}'#'${id}' group not changed`,
      );
    }
    if (
      (multiple === MonitorMultiple.SINGLE ||
        multiple === MonitorMultiple.SUBORDINATE) &&
      multipleBool &&
      groupIds.length > 0 &&
      multiple === updateMultiple
    ) {
      throw new BadRequestError(
        `Monitor '${originalMonitor.name}'#'${id}' group monitors ID must be empty`,
      );
    }
    if (multipleBool) {
      const originalGroupMonitors = await this.monitorRepository.find({
        where: {
          id: In(groupIds.map((item) => item.monitorId)),
          multiple: MonitorMultiple.SUBORDINATE,
          groupMonitors: {
            parentMonitor: Not(id),
          },
        },
        relations: { groupMonitors: { monitor: true, parentMonitor: true } },
      });
      if (originalGroupMonitors.length > 0) {
        throw new BadRequestError(
          `Monitor '${originalMonitor.name}'#'${id}' group has a SUBORDINATE monitor`,
        );
      }
    }

    await this.monitorRepository.manager.transaction(async (transact) => {
      const updated = await transact.update(MonitorEntity, id, update);
      if (!updated.affected) {
        throw new NotAcceptableError(`Monitor with this '${id}' not found`);
      }
      const monitor = await transact.findOne(MonitorEntity, {
        where: { id },
        relations: { groupMonitors: { monitor: true } },
      });
      if (!monitor) {
        throw new NotFoundError(`Monitor with this '${id}' not found`);
      }

      await this.bidService.websocketChange({ monitor });

      // а тут начинается полный трэш
      if (updateMultiple !== MonitorMultiple.SINGLE && multipleBool) {
        // получаем подчиненные мониторы
        const { groupMonitors } = monitor;
        let monitorsDeleteId: MonitorGroupEntity[] = [];
        if (groupMonitors) {
          monitorsDeleteId = groupMonitors.reduce(
            (acc, item) =>
              groupIds.find(({ monitorId }) => monitorId === item.monitorId)
                ? acc
                : [...acc, item],
            [] as MonitorGroupEntity[],
          );
        }

        // удаляем из таблицы связей мониторов мониторы
        if (monitorsDeleteId.length > 0) {
          const monitorsWSchangePromise = monitorsDeleteId.map(async (item) => {
            this.bidService.websocketChange({ monitorDelete: item.monitor });
          });
          await Promise.all(monitorsWSchangePromise);
          await transact.delete(MonitorGroupEntity, {
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
        const multiplePromise = groupIds.map(async (item) => {
          const monitorMultiple = groupMonitors?.find(
            (i) => i.monitorId === item.monitorId,
          );
          if (monitorMultiple) {
            await transact.update(
              MonitorGroupEntity,
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
            await transact.insert(MonitorGroupEntity, {
              userId,
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
        await Promise.all(multiplePromise);
      }

      return monitor;
    });

    const monitorUpdated = await this.findOne({
      find: {
        where: { id },
        relations: { groupMonitors: { monitor: true } },
      },
    });
    if (!monitorUpdated) {
      throw new NotFoundError(`Monitor with this '${id}' not found`);
    }

    return monitorUpdated;
  }

  async create({
    user,
    insert,
    groupIds,
  }: {
    user: UserEntity;
    insert: Partial<MonitorEntity>;
    groupIds?: MonitorGroup[];
  }) {
    const { id: userId } = user;
    const { multiple = MonitorMultiple.SINGLE } = insert;
    if (insert.monitorInfo) {
      throw new BadRequestError('Monitor info deprecated');
    }
    if (
      multiple === MonitorMultiple.SINGLE &&
      !(insert.width || insert.height)
    ) {
      throw new BadRequestError('Monitor width or height is empty');
    }
    const prepareMonitor: Partial<MonitorEntity> = {
      ...insert,
      userId,
    };

    return this.monitorRepository.manager.transaction(async (transact) => {
      const monitorInserted = await transact.insert(
        MonitorEntity,
        transact.create(MonitorEntity, prepareMonitor),
      );
      const monitorInsertedId = monitorInserted.identifiers[0]?.id;
      if (!monitorInsertedId) {
        throw new NotAcceptableError('Monitor not created');
      }
      const monitor = await transact.findOne(MonitorEntity, {
        where: { id: monitorInsertedId },
      });
      if (!monitor) {
        throw new NotAcceptableError('Monitor not created');
      }

      let groupMonitors: MonitorEntity[] = [];
      const multipleBool = Array.isArray(groupIds) && groupIds.length > 0;
      if (multiple !== MonitorMultiple.SINGLE) {
        if (!groupIds || groupIds.length === 0) {
          throw new BadRequestError('Group monitors ID is empty');
        }

        const multipleMonitorIds = groupIds.map((item) => item.monitorId);
        groupMonitors = await this.monitorRepository.find({
          where: {
            id: In(multipleMonitorIds),
            multiple: MonitorMultiple.SINGLE,
          },
          select: ['id'],
        });
        if (
          Array.isArray(groupMonitors) &&
          groupMonitors.length !== groupIds.length
        ) {
          throw new BadRequestError('Not found ID of some monitors');
        }
        if (multiple === MonitorMultiple.SCALING) {
          const multipleRows = new Set<number>();
          const multipleCols = new Set<number>();
          groupIds.forEach((item, i, arr) => {
            if (i && item.row > arr[i - 1]?.row) {
              multipleCols.clear();
            }
            if (multipleRows.has(item.row) && multipleCols.has(item.col)) {
              throw new BadRequestError(
                `Monitor multiple '${item.monitorId}': row '${item.row}' with col '${item.col}' is already occupied`,
              );
            }
            multipleRows.add(item.row);
            multipleCols.add(item.col);
          });
        }
      } else if (multipleBool) {
        throw new BadRequestError('Group monitors ID is not empty');
      }

      if (multipleBool) {
        const monitorMultiple = groupMonitors.map(async (groupMonitor) => {
          const groupMonitorId = groupMonitor.id;
          const item = groupIds.find((i) => i.monitorId === groupMonitorId);
          if (!item) {
            throw new BadRequestError('Not found ID of some monitors');
          }

          // добавляем в таблицу связей мониторов монитор
          await transact.insert(MonitorGroupEntity, {
            userId,
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

      await this.walletService.wsMetrics(user);

      return monitor;
    });
  }

  async attached(attached = true): Promise<void> {
    await this.monitorRepository.update({ attached: true }, { attached });
  }

  async status(
    monitor: MonitorEntity,
    status = MonitorStatus.Online,
  ): Promise<UpdateResult> {
    const { id } = monitor;
    if (monitor.multiple === MonitorMultiple.SUBORDINATE) {
      const groupMonitor = await this.monitorGroupRepository.findOne({
        where: { monitorId: id },
        select: ['id', 'parentMonitorId'],
        loadEagerRelations: false,
        relations: {},
      });
      if (groupMonitor) {
        const { parentMonitorId } = groupMonitor;
        if (status === MonitorStatus.Online) {
          await this.monitorRepository.increment(
            { id: parentMonitorId },
            'groupOnlineMonitors',
            1,
          );
        } else {
          await this.monitorRepository.decrement(
            { id: parentMonitorId },
            'groupOnlineMonitors',
            1,
          );
        }
        const monitorGroup = await this.monitorRepository.findOne({
          where: { id: parentMonitorId },
          loadEagerRelations: false,
          relations: { groupMonitors: true },
        });
        if (monitorGroup) {
          const onlineMonitors = monitorGroup.groupMonitors?.length ?? Infinity;
          if (monitorGroup.groupOnlineMonitors === onlineMonitors) {
            if (monitorGroup.status !== MonitorStatus.Online) {
              await this.monitorRepository.update(
                { id: monitorGroup.id },
                { status: MonitorStatus.Online },
              );
            }
          } else {
            if (monitorGroup.status !== MonitorStatus.Offline) {
              await this.monitorRepository.update(
                { id: monitorGroup.id },
                { status: MonitorStatus.Offline },
              );
            }
          }
        }
      }
    }
    return this.monitorRepository.update(id, { status });
  }

  async favorite(
    user: UserEntity,
    monitorId: string,
    favorite = true,
  ): Promise<MonitorEntity | null> {
    const { id: userId } = user;
    const monitor = await this.findOne({
      userId,
      find: {
        where: { id: monitorId },
      },
    });
    if (!monitor) {
      throw new NotFoundError('Monitor not found');
    }
    if (favorite && !monitor.favorite) {
      const insertResult = await this.monitorFavoriteRepository.insert({
        monitorId,
        userId,
      });
      if (!insertResult) {
        throw new NotFoundError('Monitor not found');
      }
    } else if (!favorite && monitor.favorite) {
      const { affected } = await this.monitorFavoriteRepository.delete({
        monitorId: monitor.id,
      });
      if (!affected) {
        throw new NotFoundError('Monitor not found');
      }
    }

    return this.findOne({
      userId,
      find: {
        where: { id: monitorId },
        loadEagerRelations: false,
        relations: { favorities: true },
      },
    });
  }

  async delete(monitor: MonitorEntity): Promise<DeleteResult> {
    const monitorId = monitor.id;

    await this.bidService.websocketChange({ monitorDelete: monitor });

    if (monitor.multiple !== MonitorMultiple.SINGLE) {
      return this.monitorRepository.manager.transaction(async (transact) => {
        const monitorMultiple = await transact.find(MonitorGroupEntity, {
          where: {
            parentMonitorId: monitorId,
          },
        });
        if (monitorMultiple.length > 0) {
          const monitorIdsPromise = monitorMultiple.map(async (item) => {
            await this.bidService.websocketChange({
              monitorDelete: item.monitor,
            });
            return item.monitorId;
          });
          const monitorIds = await Promise.all(monitorIdsPromise);
          await Promise.all([
            transact.update(
              MonitorEntity,
              { id: In(monitorIds) },
              { multiple: MonitorMultiple.SINGLE },
            ),
            transact.delete(MonitorGroupEntity, {
              parentMonitorId: monitorId,
            }),
          ]);
        }

        return transact.delete(MonitorEntity, { id: monitorId });
      });
    }

    return this.monitorRepository.delete({
      id: monitorId,
    });
  }
}
