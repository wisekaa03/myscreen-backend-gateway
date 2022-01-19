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
import type { Server, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LoginRequest } from '@/dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger(EventGateway.name);

  handleConnection(client: WebSocket, ...[req]: IncomingMessage[]) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const port = req.socket?.remotePort;
    this.logger.debug(
      `New connection from ip and port: '${ip}:${port}' on ${req.id}`,
    );
    client.send(JSON.stringify({ event: 'connected' }));
  }

  @SubscribeMessage('login')
  handleEvent(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: unknown,
  ): Observable<WsResponse<number>> {
    this.logger.log(
      `Data from client ${(client as any)._socket.id} : ${JSON.stringify(
        data,
      )}`,
    );
    throw new UnauthorizedException();
  }
}
