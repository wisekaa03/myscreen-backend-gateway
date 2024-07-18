import type { WebSocket } from 'ws';

import type { UserRoleEnum } from '@/enums/user-role.enum';
import type { Token } from '@/interfaces';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserEntity } from '@/database/user.entity';

export interface WebSocketClient {
  ws: WebSocket;
  key: string;
  ip: string;
  port: number;
  auth: boolean;
  monitorId?: string;
  monitor?: MonitorEntity | null;
  userId?: string;
  user?: UserEntity | null;
  role?: UserRoleEnum;
  token?: Token;
}
