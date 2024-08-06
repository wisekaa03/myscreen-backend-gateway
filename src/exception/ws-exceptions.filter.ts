import { WsEvent } from '@/enums';
import { Catch, type ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { WebSocket } from 'ws';

@Catch()
export class WsExceptionsFilter extends BaseWsExceptionFilter<WsException> {
  logger = new Logger(WsExceptionsFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<WebSocket>();
    if (typeof exception.message === 'object') {
      client.send(JSON.stringify(exception.message));
    } else {
      client.send(
        JSON.stringify({ event: WsEvent.ERROR, error: exception.message }),
      );
    }
  }
}
