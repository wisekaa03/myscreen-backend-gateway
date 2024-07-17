import { wsClients } from '@/constants';
import { BidEntity } from '@/database/bid.entity';
import { FileEntity } from '@/database/file.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorMultiple, MonitorStatus, PlaylistStatusEnum } from '@/enums';
import { WsEvent } from '@/enums/ws-event.enum';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { WsMetricsObject, WsWalletObject } from '@/websocket/interface';
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
    monitor: MonitorEntity,
    status: MonitorStatus,
    user?: UserEntity,
  ): Promise<void> {
    const { id } = monitor;
    wsClients.forEach((client) => {
      if (client.auth && client.userId) {
        client.ws.send(
          JSON.stringify([
            {
              event: WsEvent.MONITOR_STATUS,
              data: [{ id, status }],
            },
          ]),
        );
      }
    });

    if (user) {
      await this.onMetrics(user);
    }
  }

  /**
   * Вызывается из:
   *  - Создание связки плэйлиста и монитора
   *  - Удаление связки плэйлиста и монитора
   *  - Изменение плэйлиста файлами
   *  TODO: что-то еще
   * @param bid BidEntity or null
   * @param monitor MonitorEntity or null
   */
  async onChange({
    bid,
    bidDelete,
    monitor,
    monitorDelete,
    files,
    filesDelete,
  }: {
    bid?: BidEntity;
    bidDelete?: BidEntity;
    monitor?: MonitorEntity;
    monitorDelete?: MonitorEntity;
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

    if (monitor) {
      wsClients.forEach((value, client) => {
        if (value.monitorId === monitor.id) {
          if (!(monitor.playlistId || monitor.playlist)) {
            client.send(JSON.stringify([{ event: WsEvent.BID, data: null }]));
          }
        }
      });
    }

    if (monitorDelete) {
      wsClients.forEach((value, client) => {
        if (value.monitorId === monitorDelete.id) {
          client.send(
            JSON.stringify([
              {
                event: WsEvent.MONITOR_DELETE,
                data: { monitorId: monitorDelete.id },
              },
            ]),
          );
          wsClients.delete(client);
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
          total: parseFloat(`${storageSpace}`),
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
