import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';

import { wsClients } from '@/constants';
import {
  BidApprove,
  MonitorMultiple,
  MonitorStatus,
  PlaylistStatusEnum,
  WsEvent,
} from '@/enums';
import { WsMetricsObject, WsWalletObject } from '@/interfaces';
import { BidEntity } from '@/database/bid.entity';
import { FileEntity } from '@/database/file.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { PlaylistService } from '@/database/playlist.service';
import { WalletService } from '@/database/wallet.service';
import { FileService } from '@/database/file.service';
import { MonitorService } from '@/database/monitor.service';

@Injectable()
export class WsStatistics {
  constructor(
    @Inject(forwardRef(() => MonitorService))
    private readonly monitorService: MonitorService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService,
    private readonly playlistService: PlaylistService,
    private readonly walletService: WalletService,
    @InjectRepository(BidEntity)
    private readonly bidRepository: Repository<BidEntity>,
  ) {}

  /**
   * Get the bids for the monitor
   *
   * @param {string} monitorId Монитор ID
   * @param {string} playlistId Плэйлист ID
   * @param {(string | Date)} [dateLocal=new Date()] Локальная для пользователя дата
   * @return {*}
   * @memberof BidService
   */
  async monitorPlaylistToBids({
    monitorId,
    playlistId,
    dateLocal = new Date(),
  }: {
    monitorId?: string;
    playlistId?: string;
    dateLocal?: Date;
  }): Promise<BidEntity[]> {
    const monitorRequests = await this.bidRepository.find({
      where: [
        {
          monitorId,
          playlistId,
          approved: BidApprove.ALLOWED,
          dateWhen: LessThanOrEqual<Date>(dateLocal),
          dateBefore: MoreThanOrEqual<Date>(dateLocal),
        },
        {
          monitorId,
          playlistId,
          approved: BidApprove.ALLOWED,
          dateWhen: LessThanOrEqual<Date>(dateLocal),
          dateBefore: IsNull(),
        },
      ],
      relations: { playlist: { files: true } },
      loadEagerRelations: false,
      order: { updatedAt: 'DESC' },
    });

    let forceReplace = false;

    let expected = monitorRequests.filter(
      ({ dateWhen, dateBefore, playlistChange }) => {
        if (forceReplace) {
          return false;
        }
        let isExpect = true;

        if (dateBefore) {
          const date1 = new Date(dateBefore);
          date1.setSeconds(0, 0);

          isExpect = date1 >= dateLocal;
        }

        if (playlistChange) {
          const date2 = new Date(dateWhen);
          date2.setSeconds(0, 0);

          if (dateLocal >= date2) {
            forceReplace = true;
          }
        }

        return isExpect;
      },
    );

    const expectedPromise = expected.map(
      async (bid) =>
        ({
          ...bid,
          playlist: {
            ...bid.playlist,
            files: await Promise.all(
              bid!.playlist!.files.map(async (file) =>
                this.fileService.signedUrl(file),
              ),
            ),
          },
        }) as BidEntity,
    );
    expected = await Promise.all(expectedPromise);

    return expected;
  }

  /**
   * Отсылает всем подключенным клиентам (не мониторам) изменения статуса монитора
   */
  public async monitorStatus({
    userId,
    storageSpace,
    monitor,
    status,
  }: {
    userId: string;
    storageSpace?: string;
    monitor: MonitorEntity;
    status: MonitorStatus;
  }): Promise<void> {
    const { id: monitorId, user: monitorUser, userId: monitorUserId } = monitor;
    wsClients.forEach((client) => {
      if (client.auth && client.userId) {
        client.ws.send(
          JSON.stringify([
            {
              event: WsEvent.MONITOR_STATUS,
              data: [{ id: monitorId, status }],
            },
          ]),
        );
      }
    });

    if (storageSpace !== undefined) {
      this.onMetrics({ userId, storageSpace });
    }
    if (userId !== monitorUserId && monitorUser.storageSpace !== undefined) {
      this.onMetrics({
        userId: monitorUserId,
        storageSpace: monitorUser.storageSpace,
      });
    }
  }

  /**
   * Отсылает всем подключенным клиентам (мониторов) удаления монитора
   */
  async onChangeMonitorDelete({
    userId,
    storageSpace,
    monitor,
    transact,
  }: {
    userId: string;
    storageSpace?: string;
    monitor: MonitorEntity;
    transact?: EntityManager;
  }): Promise<void> {
    const { id: monitorId, user: monitorUser, userId: monitorUserId } = monitor;
    wsClients.forEach((value, client) => {
      if (value.monitorId === monitorId) {
        client.send(
          JSON.stringify([
            {
              event: WsEvent.MONITOR_DELETE,
              data: { monitorId },
            },
          ]),
        );
        wsClients.delete(client);
      }
    });

    if (storageSpace !== undefined) {
      this.onMetrics({ userId, storageSpace, transact });
    }
    if (userId !== monitorUserId) {
      this.onMetrics({
        userId: monitorUserId,
        storageSpace: monitorUser.storageSpace,
        transact,
      });
    }
  }

  /**
   * Отсылает всем подключенным клиентам (мониторов) изменения монитора
   */
  async onChangeMonitor({
    userId,
    storageSpace,
    monitor,
  }: {
    userId: string;
    storageSpace?: string;
    monitor: MonitorEntity;
  }): Promise<void> {
    const { id: monitorId, user: monitorUser, userId: monitorUserId } = monitor;

    wsClients.forEach((value, client) => {
      if (value.monitorId === monitorId) {
        if (!(monitor.playlistId || monitor.playlist)) {
          client.send(JSON.stringify([{ event: WsEvent.BID, data: null }]));
        }
      }
    });

    if (storageSpace !== undefined) {
      this.onMetrics({ userId, storageSpace });
    }
    if (userId !== monitorUserId && monitorUser.storageSpace !== undefined) {
      this.onMetrics({
        userId: monitorUserId,
        storageSpace: monitorUser.storageSpace,
      });
    }
  }

  /**
   * Отсылает всем подключенным клиентам (мониторов) удаление плэйлиста
   */
  async onChangePlaylistDelete({
    playlistId,
  }: {
    playlistId: string;
  }): Promise<void> {
    const bids = await this.monitorPlaylistToBids({
      playlistId,
    });

    const wsPromise = bids.map(async (bidDelete) =>
      this.onChange({ bidDelete }),
    );

    await Promise.allSettled(wsPromise);
  }

  /**
   * Отсылает всем подключенным клиентам (мониторов) изменение плэйлиста
   */
  async onChangePlaylist({
    playlistId,
  }: {
    playlistId: string;
  }): Promise<void> {
    const bids = await this.monitorPlaylistToBids({
      playlistId: playlistId,
    });

    const wsPromise = bids.map(async (bid) => this.onChange({ bid }));

    await Promise.allSettled(wsPromise);
  }

  /**
   * TODO: переделать на более умный алгоритм
   * Вызывается из:
   *  - Создание связки плэйлиста и монитора
   *  - Удаление связки плэйлиста и монитора
   *  - Изменение плэйлиста файлами
   * @param bid BidEntity or null
   */
  async onChange({
    bid,
    bidDelete,
    files,
    filesDelete,
  }: {
    bid?: BidEntity;
    bidDelete?: BidEntity;
    files?: FileEntity[];
    filesDelete?: FileEntity[];
  }): Promise<void> {
    if (bid?.playlist) {
      const playlistId = bid.playlistId ?? bid.playlist?.id;
      await this.playlistService.update(playlistId, {
        status: PlaylistStatusEnum.Broadcast,
      });
      const bidFind = {
        ...bid,
        playlist: {
          ...bid.playlist,
          files: await Promise.all(
            bid.playlist.files.map(async (file) =>
              this.fileService.signedUrl(file),
            ),
          ),
        },
      } as BidEntity;

      wsClients.forEach((value, client) => {
        if (value.monitorId === bid.monitorId) {
          client.send(JSON.stringify([{ event: WsEvent.BID, data: bidFind }]));
        }
      });
    }
  }

  async preWallet({
    userId,
    transact,
  }: {
    userId: string;
    transact?: EntityManager;
  }): Promise<WsWalletObject> {
    return {
      event: WsEvent.WALLET,
      data: { total: await this.walletService.walletSum({ userId, transact }) },
    };
  }

  async onWallet({
    userId,
    transact,
  }: {
    userId: string;
    transact?: EntityManager;
  }): Promise<void> {
    wsClients.forEach(async (value, client) => {
      if (value.userId === userId) {
        const wallet = await this.preWallet({ userId, transact });
        client.send(JSON.stringify([wallet]));
      }
    });
  }

  async preMetrics({
    userId,
    storageSpace,
    transact,
  }: {
    userId: string;
    storageSpace?: string;
    transact?: EntityManager;
  }): Promise<WsMetricsObject> {
    const [
      countMonitors,
      onlineMonitors,
      offlineMonitors,
      emptyMonitors,
      playlistAdded,
      playlistBroadcast,
      countUsedSpace,
    ] = await Promise.all([
      this.monitorService.countMonitors({ userId, transact }),
      this.monitorService.count({
        where: {
          userId,
          status: MonitorStatus.Online,
          multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
        },
        caseInsensitive: false,
        loadEagerRelations: false,
        relations: {},
        transact,
      }),
      this.monitorService.count({
        where: {
          userId,
          status: MonitorStatus.Offline,
          multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
        },
        caseInsensitive: false,
        loadEagerRelations: false,
        relations: {},
        transact,
      }),
      this.monitorService.count({
        where: {
          userId,
          multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
          bids: { id: IsNull() },
        },
        caseInsensitive: false,
        loadEagerRelations: false,
        relations: {},
        transact,
      }),
      this.playlistService.count({
        where: { userId },
        loadEagerRelations: false,
        relations: {},
        transact,
      }),
      this.playlistService.count({
        where: { userId, status: PlaylistStatusEnum.Broadcast },
        loadEagerRelations: false,
        relations: {},
        transact,
      }),
      this.fileService.sum({ userId, transact }),
    ]);
    return {
      event: WsEvent.METRICS,
      data: {
        monitors: {
          online: onlineMonitors,
          offline: offlineMonitors,
          empty: emptyMonitors,
          user: countMonitors,
        },
        playlists: {
          added: playlistAdded,
          played: playlistBroadcast,
        },
        storageSpace: {
          storage: countUsedSpace,
          total: parseFloat(`${storageSpace ?? 0}`),
        },
      },
    };
  }

  async onMetrics({
    userId,
    storageSpace,
    transact,
  }: {
    userId: string;
    storageSpace?: string;
    transact?: EntityManager;
  }): Promise<void> {
    wsClients.forEach(async (value, client) => {
      if (value.userId === userId) {
        const metrics = await this.preMetrics({
          userId,
          storageSpace,
          transact,
        });
        client.send(JSON.stringify([metrics]));
      }
    });
  }

  countMonitors(): number {
    return [...wsClients.values()].filter((value) => value.monitorId).length;
  }
}
