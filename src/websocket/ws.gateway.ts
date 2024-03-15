import internal from 'node:stream';
import type { IncomingMessage } from 'http';
import { isJWT } from 'class-validator';
import { Inject, Logger, UseFilters, forwardRef } from '@nestjs/common';
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

import { MonitorStatus, PlaylistStatusEnum, UserRoleEnum } from '@/enums';
import { AuthService } from '@/auth/auth.service';
import { WebSocketClient } from './interface/websocket-client';
import { AuthTokenEvent } from './interface/auth-token.event';
import { MonitorEvent } from './interface/monitor.event';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorService } from '@/database/monitor.service';
import { WsExceptionsFilter } from '@/exception/ws-exceptions.filter';
import { PlaylistService } from '@/database/playlist.service';
import { BidEntity } from '@/database/bid.entity';
import { BidService } from '@/database/bid.service';
import { FileService } from '@/database/file.service';

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
    private readonly authService: AuthService,
    @Inject(forwardRef(() => BidService))
    private readonly bidService: BidService,
    private readonly fileService: FileService,
    private readonly playlistService: PlaylistService,
    private readonly monitorService: MonitorService,
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
    let userId: string | undefined;

    const { sub, aud: role } = await this.authService
      .jwtVerify(token)
      .catch((error: any) => {
        this.logger.error(error);
        throw new WsException('Not authorized');
      });

    if (role === UserRoleEnum.Monitor) {
      monitorId = sub;
      this.logger.debug(
        `Client key='${value.key}', auth=true, role='${role}', monitorId='${monitorId}'`,
      );
    } else {
      userId = sub;
      this.logger.debug(
        `Client key='${value.key}', auth=true, role='${role}', userId='${userId}'`,
      );
    }

    const valueUpdated: WebSocketClient = {
      ...value,
      auth: true,
      token,
      monitorId,
      userId,
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
        await Promise.all([
          this.monitorService
            .update(value.monitorId, {
              status: MonitorStatus.Offline,
            })
            .catch((error: unknown) => {
              this.logger.error(error);
            }),
          this.monitorStatus(value.monitorId, MonitorStatus.Offline),
        ]);
      } else {
        this.logger.error('monitorId is undefined ?');
      }
    }
    this.clients.delete(client);
  }

  @SubscribeMessage('auth/token')
  async handleAuthToken(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() body: AuthTokenEvent,
  ): Promise<Observable<WsResponse<string | BidEntity[] | null>[]>> {
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
              relations: {},
            },
          });
          let bid: BidEntity[] | null = null;
          if (monitor) {
            [bid] = await Promise.all([
              this.bidService.monitorRequests({
                monitorId: monitor.id,
                dateLocal: new Date(body.date),
              }),
              this.monitorService
                .update(monitor.id, {
                  status: MonitorStatus.Online,
                })
                .catch((error: unknown) => {
                  this.logger.error(error);
                }),
              this.monitorStatus(monitor.id, MonitorStatus.Online),
            ]);
          }
          return of([
            { event: 'auth/token', data: 'authorized' },
            { event: 'applications', data: bid },
          ]);
        }
        return of([{ event: 'auth/token', data: 'authorized' }]);
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
    @MessageBody() body: string | MonitorEvent,
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

    let bodyObject: MonitorEvent;
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
        c.send(JSON.stringify([{ event: 'monitor', data: monitor }]));
      }
    });

    // и возвращаем Ok
    return of([{ event: 'monitor', data: 'Ok' }]);
  }

  /**
   * Отсылает всем подключенным клиентам (не мониторам) изменения статуса монитора
   */
  private async monitorStatus(
    monitorId: string,
    status: MonitorStatus,
  ): Promise<void> {
    this.clients.forEach((client) => {
      if (client.auth && client.userId) {
        client.ws.send(
          JSON.stringify([
            {
              event: 'monitorStatus',
              data: [{ id: monitorId, status }],
            },
          ]),
        );
      }
    });
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
    monitor,
  }: {
    bid?: BidEntity;
    monitor?: MonitorEntity;
  }): Promise<void> {
    if (!bid && !monitor) {
      this.logger.error('bid or monitor is required');
      return;
    }

    if (bid?.playlistId && bid.monitorId) {
      await this.playlistService.update(bid.playlistId, {
        status: PlaylistStatusEnum.Broadcast,
      });
      let bidFind: BidEntity | null = bid;
      if (!bid.playlist) {
        bidFind = await this.bidService.findOne({
          where: { id: bid.id },
          loadEagerRelations: false,
          relations: { playlist: { files: true } },
        });
        if (!bidFind) {
          this.logger.error('bid.playlist is undefined');
          return;
        }
        bidFind = {
          ...bidFind,
          playlist: {
            ...bidFind.playlist,
            files: await Promise.all(
              bidFind.playlist.files.map(async (file) =>
                this.fileService.signedUrl(file),
              ),
            ),
          },
        } as BidEntity;
      }

      this.clients.forEach((value, client) => {
        if (value.monitorId === bid.monitorId) {
          client.send(
            JSON.stringify([{ event: 'application', data: bidFind }]),
          );
        }
      });
    }

    if (monitor) {
      this.clients.forEach((value, client) => {
        if (value.monitorId === monitor.id) {
          client.send(JSON.stringify([{ event: 'application', data: null }]));
        }
      });
    }
  }

  countMonitors(): number {
    return [...this.clients.values()].filter((value) => value.monitorId).length;
  }
}
