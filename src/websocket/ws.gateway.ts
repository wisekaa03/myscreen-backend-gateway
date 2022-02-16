import { isJWT, isString, length } from 'class-validator';
import { ForbiddenException, Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { from, Observable } from 'rxjs';
// import { map } from 'rxjs/operators';

// import { LoginRequest } from '@/dto';
import { WebSocketClient } from './interface/websocket-client';
import { AuthService } from '@/auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws',
})
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
    ...[req]: IncomingMessage[]
  ): Promise<void> {
    const value: WebSocketClient = {
      ip:
        (req.headers['x-forwarded-for'] as string) ||
        req.socket?.remoteAddress ||
        ':1',
      port: req.socket?.remotePort || 0,
      key: req.headers['sec-websocket-key'] || '',
    };
    this.logger.debug(
      `New connection: '${value.ip}:${value.port}', websocket-key: '${value.key}'`,
    );
    if (true && req.headers.authorization !== undefined) {
      await this.authService.verify(req.headers.authorization);
      this.clients.set(client, value);

      client.send(JSON.stringify({ event: 'connected' }));
      return;
    }
    client.close();
  }

  handleDisconnect(client: WebSocket): void {
    const value = this.clients.get(client);
    if (value !== undefined) {
      this.logger.debug(
        `Disconnect: '${value.ip}:${value.port}', websocket-key: '${value.key}'`,
      );
      this.clients.delete(client);
    } else {
      this.logger.debug("Disconnect: ???:???, websocket-key: '???'");
    }
  }

  @SubscribeMessage('auth/code')
  handleEventCode(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() code: unknown,
  ): Observable<WsResponse<string>> {
    if (isString(code) && length(code, 11, 11)) {
      const value = this.clients.get(client);
      if (value) {
        this.logger.debug(
          `Data from client ip='${value.ip}:${value.port}' websocket-key='${value.key}': code=${code}`,
        );
        this.clients.set(client, { ...value, code });

        return from([{ event: 'auth/code', data: 'authorized' }]);
      }
    }

    throw new ForbiddenException();
  }

  @SubscribeMessage('auth/token')
  handleEventToken(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() token: unknown,
  ): Observable<WsResponse<string>> {
    if (isString(token) && isJWT(token)) {
      const value = this.clients.get(client);
      if (value) {
        this.logger.debug(
          `Data from client ip='${value.ip}:${value.port}' websocket-key='${value.key}': token=${token}`,
        );

        // TODO

        this.clients.set(client, { ...value, token });

        return from([{ event: 'auth/token', data: 'authorized' }]);
      }
    }

    throw new ForbiddenException();
  }
}
