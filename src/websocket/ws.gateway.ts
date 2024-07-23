import type { IncomingMessage } from 'http';
import { isJWT } from 'class-validator';
import { Logger, UseFilters } from '@nestjs/common';
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

import { MonitorStatus, UserRoleEnum } from '@/enums';
import { AuthService } from '@/auth/auth.service';
import {
  WebSocketClient,
  WsMonitorEvent,
  WsAuthTokenEvent,
  WsMetricsData,
  WsWalletData,
} from '@/interfaces';
import { wsClients } from '@/constants';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorService } from '@/database/monitor.service';
import { WsExceptionsFilter } from '@/exception/ws-exceptions.filter';
import { BidEntity } from '@/database/bid.entity';
import { BidService } from '@/database/bid.service';
import { WsEvent } from '@/enums/ws-event.enum';
import { UserService } from '@/database/user.service';
import { UserResponse } from '@/database/user-response.entity';
import { WsStatistics } from '@/database/ws.statistics';

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
    private readonly bidService: BidService,
    private readonly monitorService: MonitorService,
    private readonly userService: UserService,
    private readonly wsStatistics: WsStatistics,
  ) {}

  @WebSocketServer()
  private server!: Server;

  private logger = new Logger(WSGateway.name);

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
        where: { id: monitorId },
        caseInsensitive: false,
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
    wsClients.set(client, valueUpdated);

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
      wsClients.set(client, value);
      return;
    }
    client.close();
  }

  async handleDisconnect(client: WebSocket /* , ...req: any */): Promise<void> {
    const value = wsClients.get(client);
    if (value === undefined) {
      this.logger.debug('Disconnect: ???:???');
      return;
    }
    this.logger.debug(`Disconnect: key='${value.key}'`);
    if (value.role === UserRoleEnum.Monitor) {
      if (value.monitorId) {
        const monitor = await this.monitorService.findOne({
          where: { id: value.monitorId },
          loadEagerRelations: false,
          relations: { user: true },
          caseInsensitive: false,
        });
        if (monitor) {
          await this.monitorService
            .status(monitor, MonitorStatus.Offline, monitor.user)
            .catch((error: unknown) => {
              this.logger.error(error);
            });
        }
      } else {
        this.logger.error('monitorId is undefined ?');
      }
    }
    wsClients.delete(client);
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
      let value = wsClients.get(client);
      if (value) {
        value = await this.authorization(client, value, body.token);
        if (value.role === UserRoleEnum.Monitor && value.monitorId) {
          const monitor = await this.monitorService.findOne({
            where: { id: value.monitorId },
            loadEagerRelations: false,
            relations: { user: true },
            caseInsensitive: false,
          });
          let bids: BidEntity[] | null = null;
          if (monitor) {
            [bids] = await Promise.all([
              this.bidService.monitorPlaylistToBids({
                monitorId: monitor.id,
                dateLocal: new Date(body.date),
              }),
              this.monitorService
                .status(monitor, MonitorStatus.Online, monitor.user)
                .catch((error: unknown) => {
                  this.logger.error(error);
                }),
            ]);
          }
          return of([
            { event: WsEvent.AUTH, data: 'authorized' },
            { event: WsEvent.BIDS, data: bids },
          ]);
        } else if (value.user) {
          const { id: userId, storageSpace } = value.user;
          const wallet = await this.wsStatistics.preWallet(userId);
          const metrics = await this.wsStatistics.preMetrics(
            userId,
            storageSpace,
          );
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
    const value = wsClients.get(client);
    if (!value || !value.auth) {
      throw new WsException('Not authorized');
    }
    if (value.role !== UserRoleEnum.Monitor) {
      throw new WsException('This is not Role.Monitor');
    }

    let monitor = await this.monitorService.findOne({
      where: { id: value.monitorId },
      relations: {},
      caseInsensitive: false,
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
    wsClients.forEach((v, c) => {
      if (v.role === UserRoleEnum.Advertiser || v.monitorId === monitor?.id) {
        c.send(JSON.stringify([{ event: WsEvent.MONITOR, data: monitor }]));
      }
    });

    // и возвращаем Ok
    return of([{ event: WsEvent.MONITOR, data: 'Ok' }]);
  }
}
