import { wsClients } from '@/constants';
import { BidEntity } from '@/database/bid.entity';
import { FileEntity } from '@/database/file.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorMultiple, MonitorStatus, PlaylistStatusEnum } from '@/enums';
import { WsEvent } from '@/enums/ws-event.enum';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WsMetricsObject, WsWalletObject } from '@/interfaces';
import { UserEntity } from '@/database/user.entity';
import { In, IsNull } from 'typeorm';
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
  ) {}

  /**
   * Отсылает всем подключенным клиентам (не мониторам) изменения статуса монитора
   */
  public async monitorStatus(
    user: UserEntity,
    monitor: MonitorEntity,
    status: MonitorStatus,
  ): Promise<void> {
    const { id: userId } = user;
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

    await this.onMetrics(user);
    if (userId !== monitorUserId) {
      await this.onMetrics(monitorUser);
    }
  }

  /**
   * Отсылает всем подключенным клиентам (мониторов) удаления монитора
   */
  async onChangeMonitorDelete(
    user: UserEntity,
    monitor: MonitorEntity,
  ): Promise<void> {
    const { id: userId } = user;
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

    await this.onMetrics(user);
    if (userId !== monitorUserId) {
      await this.onMetrics(monitorUser);
    }
  }

  /**
   * Отсылает всем подключенным клиентам (мониторов) изменения монитора
   */
  async onChangeMonitor(
    user: UserEntity,
    monitor: MonitorEntity,
  ): Promise<void> {
    const { id: userId } = user;
    const { id: monitorId, user: monitorUser, userId: monitorUserId } = monitor;

    wsClients.forEach((value, client) => {
      if (value.monitorId === monitorId) {
        if (!(monitor.playlistId || monitor.playlist)) {
          client.send(JSON.stringify([{ event: WsEvent.BID, data: null }]));
        }
      }
    });

    await this.onMetrics(user);
    if (userId !== monitorUserId) {
      await this.onMetrics(monitorUser);
    }
  }

  /**
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
    if ((bid?.playlistId || bid?.playlist) && bid.monitorId) {
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

  async preWallet(userId: string): Promise<WsWalletObject> {
    return {
      event: WsEvent.WALLET,
      data: { total: await this.walletService.walletSum({ userId }) },
    };
  }

  async onWallet(user: UserEntity): Promise<void> {
    const { id: userId } = user;
    wsClients.forEach(async (value, client) => {
      if (value.userId === userId) {
        const wallet = await this.preWallet(userId);
        client.send(JSON.stringify([wallet]));
      }
    });
  }

  async preMetrics(
    userId: string,
    storageSpace?: number,
  ): Promise<WsMetricsObject> {
    const [
      countMonitors,
      onlineMonitors,
      offlineMonitors,
      emptyMonitors,
      playlistAdded,
      playlistBroadcast,
      countUsedSpace,
    ] = await Promise.all([
      this.monitorService.countMonitors(userId),
      this.monitorService.count({
        where: {
          userId,
          status: MonitorStatus.Online,
          multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
        },
        caseInsensitive: false,
        loadEagerRelations: false,
        relations: {},
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
      }),
      this.playlistService.count({
        where: { userId },
        loadEagerRelations: false,
        relations: {},
      }),
      this.playlistService.count({
        where: { userId, status: PlaylistStatusEnum.Broadcast },
        loadEagerRelations: false,
        relations: {},
      }),
      this.fileService.sum(userId),
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

  async onMetrics(user: UserEntity): Promise<void> {
    const { id: userId, storageSpace } = user;
    wsClients.forEach(async (value, client) => {
      if (value.userId === userId) {
        const metrics = await this.preMetrics(userId, storageSpace);
        client.send(JSON.stringify([metrics]));
      }
    });
  }

  countMonitors(): number {
    return [...wsClients.values()].filter((value) => value.monitorId).length;
  }
}
