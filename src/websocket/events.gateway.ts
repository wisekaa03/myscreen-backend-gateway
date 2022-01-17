import { Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { Socket } from 'socket.io-client';
import type { IncomingMessage } from 'http';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncApiService, AsyncApiSub } from 'nestjs-asyncapi';
import { LoginRequest } from '@/dto';

@AsyncApiService()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/api/v2/ws', // TODO
  transports: ['websocket'],
  namespace: 'file',
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket, ...[req]: IncomingMessage[]) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const port = req.socket?.remotePort;
    this.logger.debug(
      `New connection from ip and port: '${ip}:${port}' on ${client.id}`,
    );
    client.send(JSON.stringify({ event: 'connected' }));
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: number): WsResponse<boolean> {
    return { event: 'pong', data: !!(data % 2) };
  }

  @SubscribeMessage('message')
  @AsyncApiSub({
    channel: 'message',
    summary: 'Send test packet',
    description: 'method is used for test purposes',
    message: {
      name: 'test packet',
      payload: {
        type: LoginRequest,
      },
    },
  })
  handleEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ): Observable<WsResponse<number>> {
    this.logger.log(`data from client ${client.id} : ${JSON.stringify(data)}`);
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'message', data: item })),
    );
  }
}
