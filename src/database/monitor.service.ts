import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  EntityManager,
  FindManyOptions,
  In,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';

import { FindManyOptionsExt, FindOneOptionsExt } from '@/interfaces';
import { BadRequestError, NotAcceptableError, NotFoundError } from '@/errors';
import { MonitorMultiple, MonitorStatus } from '@/enums';
import { MonitorGroup } from '@/dto/request/monitor-group';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { MonitorEntity } from './monitor.entity';
import { MonitorFavoriteEntity } from './monitor.favorite.entity';
import { UserEntity } from './user.entity';
import { MonitorGroupEntity } from './monitor.group.entity';
import { WsStatistics } from './ws.statistics';
import { FileService } from './file.service';
import { FolderService } from './folder.service';
import { FileEntity } from './file.entity';
import { MonitorOnlineService } from './monitor-online.service';
import { I18nPath } from '@/i18n';
import { MonitorStatisticsEntity } from './monitor-statistics.entity';

@Injectable()
export class MonitorService {
  private logger = new Logger(MonitorService.name);

  constructor(
    private readonly folderService: FolderService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    @Inject(forwardRef(() => WsStatistics))
    private readonly wsStatistics: WsStatistics,
    private readonly monitorOnlineService: MonitorOnlineService,
    @InjectRepository(MonitorEntity)
    public readonly monitorRepository: Repository<MonitorEntity>,
    @InjectRepository(MonitorGroupEntity)
    public readonly monitorGroupRepository: Repository<MonitorGroupEntity>,
    @InjectRepository(MonitorFavoriteEntity)
    public readonly monitorFavoriteRepository: Repository<MonitorFavoriteEntity>,
    @InjectRepository(MonitorStatisticsEntity)
    public readonly monitorStatisticsRepository: Repository<MonitorStatisticsEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  async findStatistics({
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<MonitorStatisticsEntity>): Promise<
    MonitorStatisticsEntity[]
  > {
    const monitorStatistics = caseInsensitive
      ? await TypeOrmFind.findCI(this.monitorStatisticsRepository, find)
      : await this.monitorStatisticsRepository.find(find);

    return monitorStatistics;
  }

  async find({
    userId,
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<MonitorEntity>): Promise<MonitorEntity[]> {
    let _find: FindManyOptions<MonitorEntity>;

    if (find.relations === undefined) {
      _find = {
        relations: {
          photos: true,
          documents: true,
          playlist: true,
          favorities: true,
        },
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    } else {
      _find = TypeOrmFind.findParams(MonitorEntity, find);
    }

    const monitor = caseInsensitive
      ? await TypeOrmFind.findCI(this.monitorRepository, _find)
      : await this.monitorRepository.find(_find);

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

  async count({
    transact: _transact,
    ...find
  }: FindManyOptionsExt<MonitorEntity>): Promise<number> {
    const monitorWhere = TypeOrmFind.findParams(MonitorEntity, find);
    const transact = _transact
      ? _transact.withRepository(this.monitorRepository)
      : this.monitorRepository;

    const monitor = find.caseInsensitive
      ? await TypeOrmFind.countCI(transact, monitorWhere)
      : await transact.count(monitorWhere);

    return monitor;
  }

  async countMonitors({
    userId,
    transact,
  }: {
    userId: string;
    transact?: EntityManager;
  }): Promise<number> {
    return this.count({
      where: {
        userId,
        multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
      },
      caseInsensitive: false,
      loadEagerRelations: false,
      relations: {},
      transact,
    });
  }

  async findAndCount({
    userId,
    caseInsensitive = true,
    ...find
  }: FindManyOptionsExt<MonitorEntity>): Promise<[MonitorEntity[], number]> {
    let _find: FindManyOptions<MonitorEntity>;

    if (find.relations !== undefined) {
      _find = TypeOrmFind.findParams(MonitorEntity, find);
    } else {
      _find = {
        relations: {
          photos: true,
          documents: true,
          playlist: true,
          favorities: true,
          groupMonitors: true,
        },
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    }

    let monitors: MonitorEntity[] = [];
    let count = 0;
    if (!caseInsensitive) {
      [monitors, count] = await this.monitorRepository.findAndCount(_find);
    } else {
      [monitors, count] = await TypeOrmFind.findAndCountCI(
        this.monitorRepository,
        _find,
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

      const monitorsPromise = monitors.map(async (monitor: MonitorEntity) => {
        const value = monitor;
        if (
          Array.isArray(value.groupMonitors) &&
          value.groupMonitors.length > 0
        ) {
          value.groupIds = value.groupMonitors.map(
            (group: MonitorGroupEntity) => ({
              monitorId: group.monitorId,
              row: group.row,
              col: group.col,
            }),
          );
        }
        delete value.groupMonitors;
        if (value.photos?.length > 0) {
          const photosPromise = value.photos.map((photo) =>
            this.fileService.signedUrl(photo),
          );
          value.photos = await Promise.all(photosPromise);
        }
        if (value.documents?.length > 0) {
          const docPromise = value.documents.map((doc) =>
            this.fileService.signedUrl(doc),
          );
          value.documents = await Promise.all(docPromise);
        }
        return value;
      });
      monitors = await Promise.all(monitorsPromise);
    }

    return [monitors, count];
  }

  async findOne({
    userId,
    caseInsensitive = true,
    ...find
  }: FindOneOptionsExt<MonitorEntity>): Promise<MonitorEntity | null> {
    let _find: FindManyOptions<MonitorEntity>;

    if (find.relations !== undefined) {
      _find = TypeOrmFind.findParams(MonitorEntity, find);
    } else {
      _find = {
        relations: {
          photos: true,
          documents: true,
          playlist: true,
          favorities: true,
          groupMonitors: true,
        },
        ...TypeOrmFind.findParams(MonitorEntity, find),
      };
    }

    const monitor = !caseInsensitive
      ? await this.monitorRepository.findOne(_find)
      : await TypeOrmFind.findOneCI(this.monitorRepository, _find);

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
      if (monitor.photos?.length > 0) {
        const photosPromise = monitor.photos.map((photo) =>
          this.fileService.signedUrl(photo),
        );
        monitor.photos = await Promise.all(photosPromise);
      }
      if (monitor.documents?.length > 0) {
        const docPromise = monitor.documents.map((doc) =>
          this.fileService.signedUrl(doc),
        );
        monitor.documents = await Promise.all(docPromise);
      }
    }

    return monitor;
  }

  async playlistPlayed({
    monitorId,
    playlistPlayed,
  }: {
    monitorId: string;
    playlistPlayed: boolean;
  }): Promise<UpdateResult> {
    return this.monitorRepository.update(monitorId, { playlistPlayed });
  }

  async update(
    id: string,
    update: Partial<MonitorEntity>,
    groupIds?: MonitorGroup[],
    transact?: EntityManager,
  ): Promise<MonitorEntity> {
    const multipleBool = Array.isArray(groupIds);

    const originalMonitor = await this.findOne({
      where: { id },
      relations: multipleBool ? { groupMonitors: { monitor: true } } : {},
      loadEagerRelations: false,
      transact,
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
    const _transact = transact ?? this.entityManager;

    await _transact.transaction('REPEATABLE READ', async (transact) => {
      const updated = await transact.update(MonitorEntity, id, update);
      if (!updated.affected) {
        throw new NotAcceptableError(`Monitor with this '${id}' not found`);
      }
      const monitor = await transact.findOne(MonitorEntity, {
        where: { id },
        relations: { user: true, groupMonitors: { monitor: true } },
      });
      if (!monitor) {
        throw new NotFoundError(`Monitor with this '${id}' not found`);
      }

      await this.wsStatistics.onChangeMonitor({
        userId: monitor.userId,
        monitor,
        storageSpace: monitor.user?.storageSpace,
      });

      // а тут начинается полный трэш
      if (updateMultiple !== MonitorMultiple.SINGLE && multipleBool) {
        // получаем подчиненные мониторы
        const { groupMonitors } = monitor;
        let monitorsGroupDeleteId: MonitorGroupEntity[] = [];
        if (groupMonitors) {
          monitorsGroupDeleteId = groupMonitors.reduce(
            (acc, item) =>
              groupIds.find(({ monitorId }) => monitorId === item.monitorId)
                ? acc
                : [...acc, item],
            [] as MonitorGroupEntity[],
          );
        }

        // удаляем из таблицы связей мониторов мониторы
        if (monitorsGroupDeleteId.length > 0) {
          const monitorsDeleteId = monitorsGroupDeleteId.map(
            (item) => item.monitorId,
          );
          await transact.delete(MonitorGroupEntity, {
            parentMonitorId: originalMonitor.id,
            monitorId: In(monitorsDeleteId),
          });
          // и помечаем монитор как одиночный
          await transact.update(
            MonitorEntity,
            { id: In(monitorsDeleteId) },
            { multiple: MonitorMultiple.SINGLE, groupOnlineMonitors: 0 },
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
      where: { id },
      relations: { groupMonitors: { monitor: true } },
    });
    if (!monitorUpdated) {
      throw new NotFoundError(`Monitor with this '${id}' not found`);
    }

    return monitorUpdated;
  }

  async create({
    userId,
    storageSpace,
    insert,
    groupIds,
  }: {
    userId: string;
    storageSpace?: number;
    insert: Partial<MonitorEntity>;
    groupIds?: MonitorGroup[];
  }) {
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

    return this.entityManager.transaction(
      'REPEATABLE READ',
      async (transact) => {
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
          groupMonitors = await transact.find(MonitorEntity, {
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

        this.wsStatistics.onMetrics({ userId, storageSpace });

        return monitor;
      },
    );
  }

  async attached(attached = true): Promise<void> {
    await this.monitorRepository.update({ attached: true }, { attached });
  }

  async status({
    monitor,
    status = MonitorStatus.Online,
    userId,
    storageSpace,
  }: {
    monitor: MonitorEntity;
    status: MonitorStatus;
    userId: string;
    storageSpace?: number;
  }): Promise<UpdateResult> {
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
              this.wsStatistics.monitorStatus({
                userId,
                storageSpace,
                monitor: monitorGroup,
                status: MonitorStatus.Online,
              });
            }
          } else {
            if (monitorGroup.status !== MonitorStatus.Offline) {
              await this.monitorRepository.update(
                { id: monitorGroup.id },
                { status: MonitorStatus.Offline },
              );
              this.wsStatistics.monitorStatus({
                userId,
                storageSpace,
                monitor: monitorGroup,
                status: MonitorStatus.Offline,
              });
            }
          }
        }
      }
    }

    const [updated] = await Promise.all([
      this.monitorRepository.update(id, { status }),
      await this.monitorOnlineService.create({
        monitorId: id,
        status,
        userId,
      }),
      this.wsStatistics.monitorStatus({
        userId,
        storageSpace,
        monitor,
        status,
      }),
    ]);

    return updated;
  }

  async favorite(
    userId: string,
    monitorId: string,
    favorite = true,
  ): Promise<MonitorEntity | null> {
    const monitor = await this.findOne({
      userId,
      where: { id: monitorId },
    });
    if (!monitor) {
      throw new NotFoundError<I18nPath>('error.monitor.not_found', {
        args: { id: monitorId },
      });
    }
    if (favorite && !monitor.favorite) {
      const insertResult = await this.monitorFavoriteRepository.insert({
        monitorId,
        userId,
      });
      if (!insertResult) {
        throw new NotFoundError('error.monitor.not_created');
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
      where: { id: monitorId },
      loadEagerRelations: false,
      relations: { favorities: true },
    });
  }

  async delete(monitor: MonitorEntity): Promise<DeleteResult> {
    const { id: monitorId, user } = monitor;

    await this.wsStatistics.onChangeMonitorDelete({
      userId: user.id,
      storageSpace: user?.storageSpace,
      monitor,
    });

    if (monitor.multiple !== MonitorMultiple.SINGLE) {
      return this.entityManager.transaction(
        'REPEATABLE READ',
        async (transact) => {
          const monitorMultiple = await transact.find(MonitorGroupEntity, {
            where: {
              parentMonitorId: monitorId,
            },
          });
          if (monitorMultiple.length > 0) {
            const monitorIds = monitorMultiple.map((item) => item.monitorId);
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
        },
      );
    }

    return this.monitorRepository.delete({
      id: monitorId,
    });
  }

  async upload(
    user: UserEntity,
    monitor: MonitorEntity,
    {
      photos: _photos,
      documents: _docs,
    }: { photos?: Express.Multer.File[]; documents?: Express.Multer.File[] },
  ): Promise<MonitorEntity> {
    const { id: userId, storageSpace } = user;
    const { id: folderId } = await this.folderService.monitorFolder(userId);
    let photos: FileEntity[] | undefined;
    let documents: FileEntity[] | undefined;
    if (_photos) {
      photos = await this.fileService.upload({
        userId,
        storageSpace,
        files: _photos,
        folderId,
      });
    }
    if (_docs) {
      documents = await this.fileService.upload({
        userId,
        storageSpace,
        files: _docs,
        folderId,
      });
    }
    return this.monitorRepository.save(
      this.monitorRepository.merge(monitor, { photos, documents }),
    );
  }
}
