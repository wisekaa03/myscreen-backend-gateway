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

import { AuthService } from '@/auth/auth.service';
import { PlaylistEntity } from '@/database/playlist.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorService } from '@/database/monitor.service';
import { WsExceptionsFilter } from '@/exception/ws-exceptions.filter';
import { WebSocketClient } from './interface/websocket-client';
import { MonitorStatus } from '@/enums';

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
    private readonly monitorService: MonitorService,
  ) {}

  @WebSocketServer()
  private server!: Server;

  private logger = new Logger(WSGateway.name);

  private clients = new Map<WebSocket, WebSocketClient>();

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
          const { sub: monitorId, aud: roles } = await this.authService
            .jwtVerify(token)
            .catch((error) => {
              this.logger.error(error);
              throw new WsException('Not authorized');
            });
          if (monitorId && roles) {
            this.logger.debug(
              `New connection from client ip='${value.ip}:${
                value.port
              }': auth=true, monitorId='${monitorId}', roles='${JSON.stringify(
                roles,
              )}'`,
            );
            this.clients.set(client, {
              ...value,
              auth: true,
              token,
              monitorId,
              roles,
            });
            const playlist = await this.playlist(monitorId);
            client.send(
              JSON.stringify([{ event: 'playlist', data: playlist }]),
            );
            return;
          }
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
    const monitor = await this.monitorService.findOne({
      where: { id: value.monitorId },
    });
    if (monitor) {
      await this.monitorService.update(
        monitor.userId,
        Object.assign(monitor, {
          status: MonitorStatus.Offline,
        }),
      );
    } else {
      this.logger.error(`Disconnect: '${value.monitorId}' is not monitor`);
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
        const { sub: monitorId, aud: roles } = await this.authService
          .jwtVerify(token)
          .catch((error) => {
            this.logger.error(error);
            throw new WsException('Not authorized');
          });
        if (monitorId && roles) {
          this.logger.debug(
            `Data from client ip='${value.ip}:${
              value.port
            }': auth=true, monitorId='${monitorId}', roles='${JSON.stringify(
              roles,
            )}'`,
          );
          this.clients.set(client, {
            ...value,
            auth: true,
            token,
            monitorId,
            roles,
          });
          const playlist = await this.playlist(monitorId);
          return of([
            { event: 'auth/token', data: 'authorized' },
            { event: 'playlist', data: playlist },
          ]);
        }
      }
    }
    throw new WsException('Not authorized');
  }

  @SubscribeMessage('monitor')
  async monitor(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { playlistPlayed: boolean },
  ): Promise<Observable<WsResponse<string>[]>> {
    const value = this.clients.get(client);
    if (value) {
      const monitor = await this.monitorService.findOne({
        where: { id: value.monitorId },
      });
      if (!monitor) {
        throw new WsException('Not authorized. Not exist monitorId.');
      }
      await this.monitorService.update(
        monitor.userId,
        Object.assign(monitor, {
          playlistPlayed: data.playlistPlayed,
        }),
      );
      return of([{ event: 'monitor', data: 'Ok' }]);
    }
    throw new WsException('Not authorized.');
  }

  private async playlist(monitorId: string): Promise<PlaylistEntity | null> {
    const monitor = await this.monitorService.findOne({
      where: { id: monitorId },
    });
    if (!monitor) {
      return null;
    }
    await this.monitorService.update(
      monitor.userId,
      Object.assign(monitor, {
        status: MonitorStatus.Online,
      }),
    );
    if (monitor.playlist === undefined) {
      return null;
    }
    return monitor.playlist;
  }

  async monitorPlaylist(
    monitor: MonitorEntity,
    playlist: PlaylistEntity | null,
  ): Promise<void> {
    this.clients.forEach((value, client) => {
      if (value.monitorId === monitor.id) {
        client.send(JSON.stringify([{ event: 'playlist', data: playlist }]));
      }
    });
    await this.monitorService.update(
      monitor.userId,
      Object.assign(monitor, {
        status: MonitorStatus.Online,
      }),
    );
  }
}
