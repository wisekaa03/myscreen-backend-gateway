import type { WebSocket } from 'ws';
import type { UserRoleEnum } from '@/enums';
import type { Token } from '@/dto/interface';

export interface WebSocketClient {
  ws: WebSocket;
  ip: string;
  port: number;
  auth: boolean;
  monitorId?: string;
  roles?: UserRoleEnum[];
  token?: Token;
}
