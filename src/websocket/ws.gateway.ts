import { isJWT } from 'class-validator';
import { Logger, UseFilters } from '@nestjs/common';
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
import { In } from 'typeorm';
import type { Server, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { Observable, of } from 'rxjs';

import { AuthService } from '@/auth/auth.service';
import { UserService } from '@/database/user.service';
import { PlaylistEntity } from '@/database/playlist.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorService } from '@/database/monitor.service';
import { WsExceptionsFilter } from '@/exception/ws-exceptions.filter';
import { MonitorStatus, UserRoleEnum } from '@/enums';
import { WebSocketClient } from './interface/websocket-client';

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
    private readonly userService: UserService,
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
  ): Promise<WebSocketClient | undefined> {
    const { sub: userId, aud: roles } = await this.authService
      .jwtVerify(token)
      .catch((error) => {
        this.logger.error(error);
        throw new WsException('Not authorized');
      });
    if (userId && roles) {
      this.logger.debug(
        `Client ip='${value.ip}:${
          value.port
        }': auth=true, userId/monitorId='${userId}', roles='${JSON.stringify(
          roles,
        )}'`,
      );
      const valueUpdated = {
        ...value,
        auth: true,
        token,
        userId,
        roles,
      };
      this.clients.set(client, valueUpdated);
      return valueUpdated;
    }
    return undefined;
  }

  async handleConnection(
    client: WebSocket,
    req: IncomingMessage,
  ): Promise<void> {
    if (req.headers['sec-websocket-key'] !== undefined) {
      const value: WebSocketClient = {
        ws: client,
        ip:
          (req.headers['x-forwarded-for'] as string) ||
          req.socket?.remoteAddress ||
          ':1',
        port: req.socket?.remotePort || 0,
        auth: false,
      };
      if (req.headers.authorization !== undefined) {
        // Authentication through token
        const token = req.headers.authorization.split(' ', 2).pop();
        if (token) {
          const valueUpdated = await this.authorization(client, value, token);
          if (valueUpdated?.roles?.includes(UserRoleEnum.Monitor)) {
            const monitor = await this.monitorService.findOne({
              where: { id: valueUpdated.userId },
              relations: [],
            });
            if (monitor) {
              /* await */ this.monitorService
                .update(
                  monitor.userId,
                  Object.assign(monitor, {
                    status: MonitorStatus.Online,
                  }),
                )
                .catch((error) => {
                  this.logger.error(error);
                });
              /* await */ this.monitorStatus(monitor.id, MonitorStatus.Online);
            }
            client.send(
              JSON.stringify([
                { event: 'playlist', data: monitor?.playlist ?? null },
              ]),
            );
          }
          return;
        }
      } else {
        this.logger.debug(`New connection: '${value.ip}:${value.port}'`);
      }
      this.clients.set(client, {
        ...value,
        auth: false,
      });
      return;
    }
    client.close();
  }

  async handleDisconnect(client: WebSocket, ...req: any): Promise<void> {
    const value = this.clients.get(client);
    if (value === undefined) {
      this.logger.debug('Disconnect: ???:???');
      return;
    }
    this.logger.debug(`Disconnect: '${value.ip}:${value.port}'`);
    if (value.roles?.includes(UserRoleEnum.Monitor)) {
      const monitor = await this.monitorService.findOne({
        where: { id: value.userId },
      });
      if (monitor) {
        /* await */ this.monitorService
          .update(
            monitor.userId,
            Object.assign(monitor, {
              status: MonitorStatus.Offline,
            }),
          )
          .catch((error) => {
            this.logger.error(error);
          });
        /* await */ this.monitorStatus(monitor.id, MonitorStatus.Offline);
      }
    }
    this.clients.delete(client);
  }

  @SubscribeMessage('auth/token')
  async handleAuthToken(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() token: string,
  ): Promise<Observable<WsResponse<string | PlaylistEntity | null>[]>> {
    if (isJWT(token)) {
      const value = this.clients.get(client);
      if (value) {
        const valueUpdated = await this.authorization(client, value, token);
        if (valueUpdated?.roles?.includes(UserRoleEnum.Monitor)) {
          const monitor = await this.monitorService.findOne({
            where: { id: valueUpdated.userId },
            relations: [],
          });
          if (monitor) {
            /* await */ this.monitorService
              .update(
                monitor.userId,
                Object.assign(monitor, {
                  status: MonitorStatus.Online,
                }),
              )
              .catch((error) => {
                this.logger.error(error);
              });
          }
          return of([
            { event: 'auth/token', data: 'authorized' },
            { event: 'playlist', data: monitor?.playlist ?? null },
          ]);
        }
        return of([{ event: 'auth/token', data: 'authorized' }]);
      }
    }
    throw new WsException('Not authorized');
  }

  /**
   * monitorPlay - Нам присылают event, мы на это отсылаем Ok и
   * попутно проходим всех подключенных к WS со ролью Advertiser и выставляем monitorPlayed
   */
  @SubscribeMessage('monitor')
  async monitorPlay(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: string | Record<string, boolean>,
  ): Promise<Observable<WsResponse<string>[]>> {
    const value = this.clients.get(client);
    if (value && value.auth) {
      if (value.roles?.includes(UserRoleEnum.Monitor)) {
        let monitor = await this.monitorService.findOne({
          where: { id: value.userId },
        });
        if (!monitor) {
          throw new WsException('Not exist monitorId');
        }
        let dataObject: Record<string, boolean>;
        if (typeof data === 'string') {
          try {
            dataObject = JSON.parse(data);
          } catch (e) {
            throw new WsException('Error in parsing data');
          }
        } else {
          dataObject = data;
        }
        // записываем в базу данных
        monitor = await this.monitorService.update(
          monitor.userId,
          Object.assign(monitor, {
            playlistPlayed: dataObject.playlistPlayed,
          }),
        );
        // Отсылаем всем кто к нам подключен по WS изменения playlist-а в monitor
        this.clients.forEach((v, c) => {
          if (
            v.roles?.includes(UserRoleEnum.Advertiser) ||
            v.userId === monitor?.userId
          ) {
            c.send(JSON.stringify([{ event: 'monitor', data: monitor }]));
          }
        });
        // и возвращаем Ok
        return of([{ event: 'monitor', data: 'Ok' }]);
      }
      throw new WsException('This is not Role.Monitor');
    }
    throw new WsException('Not authorized');
  }

  private async monitorStatus(
    monitorId: string,
    status: MonitorStatus,
  ): Promise<void> {
    this.clients.forEach((client) => {
      if (!client.roles?.includes(UserRoleEnum.Monitor)) {
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
   *  - TODO
   * @param monitor
   * @param playlist
   */
  async monitorPlaylist(
    monitor: MonitorEntity,
    playlist: PlaylistEntity | null,
  ): Promise<void> {
    this.clients.forEach((value, client) => {
      if (value.userId === monitor.id) {
        client.send(JSON.stringify([{ event: 'playlist', data: playlist }]));
      }
    });
    await this.monitorService
      .update(
        monitor.userId,
        Object.assign(monitor, {
          status: MonitorStatus.Online,
        }),
      )
      .catch((error) => {
        this.logger.error(error);
      });
  }
}
