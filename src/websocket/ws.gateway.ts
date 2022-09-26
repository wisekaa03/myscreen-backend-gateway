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
import type { Server, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { Observable, of } from 'rxjs';

import { IsNull, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { MonitorEntity } from '../database/monitor.entity';
import { MonitorService } from '../database/monitor.service';
import { WsExceptionsFilter } from '../exception/ws-exceptions.filter';
import {
  ApplicationApproved,
  MonitorStatus,
  PlaylistStatusEnum,
  UserRoleEnum,
} from '../enums/index';
import { WebSocketClient } from './interface/websocket-client';
import { PlaylistService } from '../database/playlist.service';
import { ApplicationEntity } from '../database/application.entity';
import { ApplicationService } from '@/database/application.service';

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
    private readonly applicationService: ApplicationService,
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
  ): Promise<WebSocketClient | undefined> {
    const { sub: monitorId, aud: roles } = await this.authService
      .jwtVerify(token)
      .catch((error: any) => {
        this.logger.error(error);
        throw new WsException('Not authorized');
      });
    if (monitorId && roles) {
      this.logger.debug(
        `Client key='${
          value.key
        }', auth=true, monitorId='${monitorId}', roles='${JSON.stringify(
          roles,
        )}'`,
      );
      const valueUpdated: WebSocketClient = {
        ...value,
        auth: true,
        token,
        monitorId,
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
        key: req.headers['sec-websocket-key'],
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
            const monitor = await this.monitorService.findOne(
              valueUpdated.monitorId || 'monitorFavoritiesDisabled',
              {
                where: { id: valueUpdated.monitorId },
                relations: ['playlist', 'user'],
              },
            );
            let application: ApplicationEntity[] | null = null;
            if (monitor) {
              [application] = await Promise.all([
                this.applicationService.find({
                  where: [
                    {
                      monitorId: monitor.id,
                      approved: ApplicationApproved.Allowed,
                      dateWhen: LessThanOrEqual<Date>(new Date(Date.now())),
                      dateBefore: MoreThanOrEqual<Date>(new Date(Date.now())),
                    },
                    {
                      monitorId: monitor.id,
                      approved: ApplicationApproved.Allowed,
                      dateWhen: LessThanOrEqual<Date>(new Date(Date.now())),
                      dateBefore: IsNull(),
                    },
                  ],
                }),
                this.monitorService
                  .update(
                    monitor.userId,
                    Object.assign(monitor, {
                      status: MonitorStatus.Online,
                    }),
                  )
                  .catch((error: any) => {
                    this.logger.error(error);
                  }),
                this.monitorStatus(monitor.id, MonitorStatus.Online),
              ]);
            }
            client.send(
              JSON.stringify([{ event: 'application', data: application }]),
            );
          }
          return;
        }
      } else {
        this.logger.debug(`New connection: key='${value.key}'`);
      }
      this.clients.set(client, {
        ...value,
        auth: false,
      });
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
    if (value.roles?.includes(UserRoleEnum.Monitor)) {
      const monitor = await this.monitorService.findOne(
        value.monitorId || 'monitorFavoritiesDisabled',
        {
          where: { id: value.monitorId },
        },
      );
      if (monitor) {
        await Promise.all([
          this.monitorService
            .update(
              monitor.userId,
              Object.assign(monitor, {
                status: MonitorStatus.Offline,
              }),
            )
            .catch((error: any) => {
              this.logger.error(error);
            }),
          this.monitorStatus(monitor.id, MonitorStatus.Offline),
        ]);
      }
    }
    this.clients.delete(client);
  }

  @SubscribeMessage('auth/token')
  async handleAuthToken(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() token: string,
  ): Promise<Observable<WsResponse<string | ApplicationEntity[] | null>[]>> {
    if (isJWT(token)) {
      const value = this.clients.get(client);
      if (value) {
        const valueUpdated = await this.authorization(client, value, token);
        if (valueUpdated?.roles?.includes(UserRoleEnum.Monitor)) {
          const monitor = await this.monitorService.findOne(
            valueUpdated.monitorId || 'monitorFavoritiesDisabled',
            {
              where: { id: valueUpdated.monitorId },
              relations: ['playlist', 'user'],
            },
          );
          let application: ApplicationEntity[] | null = null;
          if (monitor) {
            [application] = await Promise.all([
              this.applicationService.find({
                where: [
                  {
                    monitorId: monitor.id,
                    approved: ApplicationApproved.Allowed,
                    dateWhen: LessThanOrEqual<Date>(new Date(Date.now())),
                    dateBefore: MoreThanOrEqual<Date>(new Date(Date.now())),
                  },
                  {
                    monitorId: monitor.id,
                    approved: ApplicationApproved.Allowed,
                    dateWhen: LessThanOrEqual<Date>(new Date(Date.now())),
                    dateBefore: IsNull(),
                  },
                ],
              }),
              this.monitorService
                .update(
                  monitor.userId,
                  Object.assign(monitor, {
                    status: MonitorStatus.Online,
                  }),
                )
                .catch((error: any) => {
                  this.logger.error(error);
                }),
              this.monitorStatus(monitor.id, MonitorStatus.Online),
            ]);
          }
          return of([
            { event: 'auth/token', data: 'authorized' },
            { event: 'application', data: application },
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
        let monitor = await this.monitorService.findOne(
          value.monitorId || 'monitorFavoritiesDisabled',
          {
            where: { id: value.monitorId },
          },
        );
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
        // { "event": "monitor", "data": "true" }
        // записываем в базу данных
        monitor = await this.monitorService.update(
          monitor.userId,
          Object.assign(monitor, {
            playlistPlayed: dataObject?.playlistPlayed,
          }),
        );
        // Отсылаем всем кто к нам подключен по WS изменения playlist-а в monitor
        this.clients.forEach((v, c) => {
          if (
            v.roles?.includes(UserRoleEnum.Advertiser) ||
            v.monitorId === monitor?.id
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
      if (client.auth && !client.roles?.includes(UserRoleEnum.Monitor)) {
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
   * @param application ApplicationEntity or null
   * @param monitor MonitorEntity or null
   */
  async application(
    application: ApplicationEntity | null,
    monitor?: MonitorEntity | null,
  ): Promise<void> {
    if (application === null && monitor === null) {
      this.logger.error('ApplicationEntity or MonitorEntity is required');
      return;
    }

    if (application?.playlist && application?.monitor) {
      await this.playlistService.update(application.playlist.userId, {
        id: application.playlist.id,
        status: PlaylistStatusEnum.Broadcast,
      });

      this.clients.forEach((value, client) => {
        if (value.monitorId === application.monitor.id) {
          client.send(
            JSON.stringify([{ event: 'application', data: application }]),
          );
        }
      });
    } else {
      this.logger.error(
        'application.playlist or application.monitor is required',
      );
    }

    if (monitor) {
      this.clients.forEach((value, client) => {
        if (value.monitorId === monitor.id) {
          client.send(JSON.stringify([{ event: 'application', data: null }]));
        }
      });
    }
  }

  statistics(): number {
    return [...this.clients.values()].filter((value) =>
      value.roles?.includes(UserRoleEnum.Monitor),
    ).length;
  }
}
