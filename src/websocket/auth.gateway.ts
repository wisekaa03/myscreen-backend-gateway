import { Logger, UnauthorizedException } from '@nestjs/common';
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

@AsyncApiService({
  serviceName: 'auth',
})
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/api/v2/ws', // TODO
  transports: ['websocket'],
  namespace: 'auth',
})
export class AuthGatewayProvider implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(AuthGatewayProvider.name);

  handleConnection(client: Socket, ...[req]: IncomingMessage[]) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const port = req.socket?.remotePort;
    this.logger.debug(
      `New connection from ip and port: '${ip}:${port}' on ${client.id}`,
    );
    client.send(JSON.stringify({ event: 'connected' }));
  }

  @SubscribeMessage('auth/login')
  @AsyncApiSub({
    channel: 'auth',
    description: 'Авторизация пользователя',
    tags: [{ name: 'auth' }],
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
    throw new UnauthorizedException();
  }
}
