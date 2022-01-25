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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws',
})
export class EventGateway
  implements OnGatewayConnection<WebSocket>, OnGatewayDisconnect<WebSocket>
{
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(EventGateway.name);

  clients = new Map<WebSocket, WebSocketClient>();

  handleConnection(client: WebSocket, ...[req]: IncomingMessage[]): void {
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
    this.clients.set(client, value);
    client.send(JSON.stringify({ event: 'connected' }));
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
