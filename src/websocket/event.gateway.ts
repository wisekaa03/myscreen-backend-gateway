import { Logger, UnauthorizedException } from '@nestjs/common';
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
import { map } from 'rxjs/operators';
import { LoginRequest } from '@/dto';
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

  @SubscribeMessage('auth')
  handleEvent(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: unknown,
  ): WsResponse<string> {
    const value = this.clients.get(client);
    if (value) {
      this.logger.log(
        `Data from client '${value.ip}:${value.port}', websocket-key: '${
          value.key
        }' : ${JSON.stringify(data)}`,
      );

      return { event: 'auth', data: value.key };
    }

    throw new UnauthorizedException();
  }
}
