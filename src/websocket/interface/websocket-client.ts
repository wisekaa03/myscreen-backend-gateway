import type { WebSocket } from 'ws';

import type { UserRoleEnum } from '@/enums/user-role.enum';
import type { Token } from '@/dto/interface';

export interface WebSocketClient {
  ws: WebSocket;
  key: string;
  ip: string;
  port: number;
  auth: boolean;
  monitorId?: string;
  roles?: UserRoleEnum[];
  token?: Token;
}
