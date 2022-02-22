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
import { from, Observable } from 'rxjs';

import { AuthService } from '@/auth/auth.service';
import { PlaylistEntity } from '@/database/playlist.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { WebSocketClient } from './interface/websocket-client';
import { WsExceptionsFilter } from '@/exception/ws-exceptions.filter';

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
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server!: Server;

  private logger = new Logger(WSGateway.name);

  clients = new Map<WebSocket, WebSocketClient>();

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
      this.logger.debug(`New connection: '${value.ip}:${value.port}'`);
      if (req.headers.authorization !== undefined) {
        // Authentication through token
        const token = req.headers.authorization.split(' ', 2).pop();
        if (token) {
          const { sub: code, aud: roles } = await this.authService
            .jwtVerify(token)
            .catch((error) => {
              this.logger.error(error);
              throw new WsException('Token exception');
            });
          this.clients.set(client, {
            ...value,
            auth: true,
            token,
            code,
            roles,
          });
          return;
        }
      }
      this.clients.set(client, {
        ...value,
        auth: false,
      });
      return;
    }
    client.close();
  }

  handleDisconnect(client: WebSocket, ...req: any): void {
    const value = this.clients.get(client);
    if (value === undefined) {
      this.logger.debug('Disconnect: ???:???');
      return;
    }
    this.logger.debug(`Disconnect: '${value.ip}:${value.port}'`);
    this.clients.delete(client);
  }

  @SubscribeMessage('auth/token')
  async handleAuthToken(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() token: string,
  ): Promise<Observable<WsResponse<string>>> {
    if (isJWT(token)) {
      const value = this.clients.get(client);
      if (value) {
        this.logger.debug(
          `Data from client ip='${value.ip}:${value.port}': token='${token}'`,
        );
        const { sub: code, aud: roles } = await this.authService
          .jwtVerify(token)
          .catch((error) => {
            this.logger.error(error);
            throw new WsException('Token exception');
          });
        this.clients.set(client, { ...value, auth: true, token, code, roles });

        return from([{ event: 'auth/token', data: 'authorized' }]);
      }
    }
    throw new WsException('Token exception');
  }

  async monitorPlaylist(
    userId: string,
    monitor: MonitorEntity,
    playlist: PlaylistEntity,
  ): Promise<void> {
    // eslint-disable-next-line no-debugger
    debugger;
  }
}
