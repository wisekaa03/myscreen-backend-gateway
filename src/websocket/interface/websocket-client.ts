import type { WebSocket } from 'ws';

import type { UserRoleEnum } from '@/enums/user-role.enum';
import type { Token } from '@/interfaces';

export interface WebSocketClient {
  ws: WebSocket;
  key: string;
  ip: string;
  port: number;
  auth: boolean;
  monitorId?: string;
  userId?: string;
  role?: UserRoleEnum;
  token?: Token;
}
