import type { IncomingMessage } from 'http';
import { isJWT } from 'class-validator';
import { Inject, Logger, UseFilters, forwardRef } from '@nestjs/common';
import { In, IsNull } from 'typeorm';
import '@nestjs/platform-ws';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { type Server, type WebSocket } from 'ws';
import { Observable, of } from 'rxjs';

import {
  MonitorMultiple,
  MonitorStatus,
  PlaylistStatusEnum,
  UserRoleEnum,
} from '@/enums';
import { AuthService } from '@/auth/auth.service';
import {
  WebSocketClient,
  WsMonitorEvent,
  WsAuthTokenEvent,
  WsMetricsData,
  WsMetricsObject,
  WsWalletData,
  WsWalletObject,
} from './interface';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorService } from '@/database/monitor.service';
import { WsExceptionsFilter } from '@/exception/ws-exceptions.filter';
import { PlaylistService } from '@/database/playlist.service';
import { BidEntity } from '@/database/bid.entity';
import { BidService } from '@/database/bid.service';
import { FileService } from '@/database/file.service';
import { WsEvent } from '@/enums/ws-event.enum';
import { UserEntity } from '@/database/user.entity';
import { WalletService } from '@/database/wallet.service';
import { UserService } from '@/database/user.service';
import { UserResponse } from '@/database/user-response.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws',
})
@UseFilters(WsExceptionsFilter)
export class WSGateway
  implements OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket>
{
  constructor(
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    private readonly bidService: BidService,
    private readonly fileService: FileService,
    private readonly playlistService: PlaylistService,
    private readonly monitorService: MonitorService,
    private readonly walletService: WalletService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  private server!: Server;

  private logger = new Logger(WSGateway.name);

  private clients = new Map<WebSocket, WebSocketClient>();

  private async authorization(
    client: WebSocket,
    value: WebSocketClient,
    token: string,
  ): Promise<WebSocketClient> {
    let monitorId: string | undefined;
    let monitor: MonitorEntity | undefined | null;
    let userId: string | undefined;
    let user: UserResponse | undefined | null;

    const { sub, aud: role } = await this.authService
      .jwtVerify(token)
      .catch((error: any) => {
        this.logger.error(error);
        throw new WsException('Not authorized');
      });

    if (role === UserRoleEnum.Monitor && sub) {
      monitorId = sub;
      monitor = await this.monitorService.findOne({
        find: { where: { id: monitorId } },
      });
      if (!monitor) {
        throw new WsException('Not authorized');
      }

      this.logger.debug(
        `Client key='${value.key}', auth=true, role='${role}', monitorId='${monitorId}'`,
      );
    } else if (sub) {
      userId = sub;
      user = await this.userService.findById(userId);
      if (!user) {
        throw new WsException('Not authorized');
      }

      this.logger.debug(
        `Client key='${value.key}', auth=true, role='${role}', userId='${userId}'`,
      );
    } else {
      throw new WsException('Not authorized');
    }

    const valueUpdated: WebSocketClient = {
      ...value,
      auth: true,
      token,
      monitorId,
      monitor,
      userId,
      user,
      role,
    };
    this.clients.set(client, valueUpdated);

    return valueUpdated;
  }

  async handleConnection(
    client: WebSocket,
    req: IncomingMessage,
  ): Promise<void> {
    if (req.headers['sec-websocket-key'] !== undefined) {
      const value: WebSocketClient = {
        ws: client,
        key: req.headers['sec-websocket-key'],
        ip:
          (req.headers['x-forwarded-for'] as string) ||
          req.socket?.remoteAddress ||
          ':1',
        port: req.socket?.remotePort || 0,
        auth: false,
      };
      this.logger.debug(`WebSocket new connection: key='${value.key}'`);
      this.clients.set(client, value);
      return;
    }
    client.close();
  }

  async handleDisconnect(client: WebSocket /* , ...req: any */): Promise<void> {
    const value = this.clients.get(client);
    if (value === undefined) {
      this.logger.debug('Disconnect: ???:???');
      return;
    }
    this.logger.debug(`Disconnect: key='${value.key}'`);
    if (value.role === UserRoleEnum.Monitor) {
      if (value.monitorId) {
        const monitor = await this.monitorService.findOne({
          find: {
            where: { id: value.monitorId },
            loadEagerRelations: false,
            relations: { user: true },
          },
        });
        await Promise.all([
          this.monitorService
            .status(value.monitorId, MonitorStatus.Offline)
            .catch((error: unknown) => {
              this.logger.error(error);
            }),
          this.monitorStatus(
            value.monitorId,
            MonitorStatus.Offline,
            monitor?.user,
          ),
        ]);
      } else {
        this.logger.error('monitorId is undefined ?');
      }
    }
    this.clients.delete(client);
  }

  @SubscribeMessage(WsEvent.AUTH)
  async handleAuthToken(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() body: WsAuthTokenEvent,
  ): Promise<
    Observable<
      WsResponse<string | BidEntity[] | WsMetricsData | WsWalletData | null>[]
    >
  > {
    if (!(body.token && body.date)) {
      throw new WsException('Not authorized');
    }
    if (isJWT(body.token)) {
      let value = this.clients.get(client);
      if (value) {
        value = await this.authorization(client, value, body.token);
        if (value.role === UserRoleEnum.Monitor && value.monitorId) {
          const monitor = await this.monitorService.findOne({
            find: {
              where: { id: value.monitorId },
              loadEagerRelations: false,
              relations: { user: true },
            },
          });
          let bids: BidEntity[] | null = null;
          if (monitor) {
            [bids] = await Promise.all([
              this.bidService.monitorRequests({
                monitorId: monitor.id,
                dateLocal: new Date(body.date),
              }),
              this.monitorService
                .status(monitor.id, MonitorStatus.Online)
                .catch((error: unknown) => {
                  this.logger.error(error);
                }),
              this.monitorStatus(
                monitor.id,
                MonitorStatus.Online,
                monitor.user,
              ),
            ]);
          }
          return of([
            { event: WsEvent.AUTH, data: 'authorized' },
            { event: WsEvent.BIDS, data: bids },
          ]);
        } else if (value.user) {
          const { id: userId, storageSpace } = value.user;
          const wallet = await this.preWallet(userId);
          const metrics = await this.preMetrics(userId, storageSpace);
          return of([
            { event: WsEvent.AUTH, data: 'authorized' },
            wallet,
            metrics,
          ]);
        }
        return of([{ event: WsEvent.AUTH, data: 'authorized' }]);
      }
    }
    throw new WsException('Not authorized');
  }

  /**
   * monitor - Нам присылают event с Монитора, мы на это отсылаем Ok и
   * попутно проходим всех подключенных к WS со ролью Advertiser и выставляем monitorPlayed
   */
  @SubscribeMessage('monitor')
  async handleMonitor(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() body: string | WsMonitorEvent,
  ): Promise<Observable<WsResponse<string>[]>> {
    const value = this.clients.get(client);
    if (!value || !value.auth) {
      throw new WsException('Not authorized');
    }
    if (value.role !== UserRoleEnum.Monitor) {
      throw new WsException('This is not Role.Monitor');
    }

    let monitor = await this.monitorService.findOne({
      find: {
        where: { id: value.monitorId },
        relations: {},
      },
    });
    if (!monitor) {
      throw new WsException('Not exist monitorId');
    }

    let bodyObject: WsMonitorEvent;
    if (typeof body === 'string') {
      try {
        bodyObject = JSON.parse(body);
      } catch (e) {
        throw new WsException('WebSocket: Error in parsing data');
      }
    } else {
      bodyObject = body;
    }

    // записываем в базу данных
    monitor = await this.monitorService.update(monitor.id, {
      playlistPlayed: bodyObject.playlistPlayed,
    });

    // Отсылаем всем кто к нам подключен по WS изменения playlist-а в monitor
    this.clients.forEach((v, c) => {
      if (v.role === UserRoleEnum.Advertiser || v.monitorId === monitor?.id) {
        c.send(JSON.stringify([{ event: WsEvent.MONITOR, data: monitor }]));
      }
    });

    // и возвращаем Ok
    return of([{ event: WsEvent.MONITOR, data: 'Ok' }]);
  }

  /**
   * Отсылает всем подключенным клиентам (не мониторам) изменения статуса монитора
   */
  private async monitorStatus(
    monitorId: string,
    status: MonitorStatus,
    user?: UserEntity,
  ): Promise<void> {
    this.clients.forEach((client) => {
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
  }: {
    bid?: BidEntity;
    bidDelete?: BidEntity;
    monitor?: MonitorEntity;
    monitorDelete?: MonitorEntity;
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

      this.clients.forEach((value, client) => {
        if (value.monitorId === bid.monitorId) {
          client.send(JSON.stringify([{ event: WsEvent.BID, data: bidFind }]));
        }
      });
    }

    if (monitor) {
      this.clients.forEach((value, client) => {
        if (value.monitorId === monitor.id) {
          if (!(monitor.playlistId || monitor.playlist)) {
            client.send(JSON.stringify([{ event: WsEvent.BID, data: null }]));
          }
        }
      });
    }

    if (monitorDelete) {
      this.clients.forEach((value, client) => {
        if (value.monitorId === monitorDelete.id) {
          client.send(
            JSON.stringify([
              {
                event: WsEvent.MONITOR_DELETE,
                data: { monitorId: monitorDelete.id },
              },
            ]),
          );
          this.clients.delete(client);
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
    this.clients.forEach(async (value, client) => {
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
      this.monitorService.count({
        find: {
          where: {
            userId,
            multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
          },
        },
        caseInsensitive: false,
      }),
      this.monitorService.count({
        find: {
          where: {
            userId,
            status: MonitorStatus.Online,
            multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
          },
        },
        caseInsensitive: false,
      }),
      this.monitorService.count({
        find: {
          where: {
            userId,
            status: MonitorStatus.Offline,
            multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
          },
        },
        caseInsensitive: false,
      }),
      this.monitorService.count({
        find: {
          where: {
            userId,
            multiple: In([MonitorMultiple.SINGLE, MonitorMultiple.SUBORDINATE]),
            bids: { id: IsNull() },
          },
        },
        caseInsensitive: false,
      }),
      this.playlistService.count({
        where: { userId },
      }),
      this.playlistService.count({
        where: { userId, status: PlaylistStatusEnum.Broadcast },
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
    this.clients.forEach(async (value, client) => {
      if (value.userId === userId) {
        const metrics = await this.preMetrics(userId, storageSpace);
        client.send(JSON.stringify([metrics]));
      }
    });
  }

  countMonitors(): number {
    return [...this.clients.values()].filter((value) => value.monitorId).length;
  }
}
