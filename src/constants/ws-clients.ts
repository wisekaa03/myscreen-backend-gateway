import type { WebSocket } from 'ws';
import { WebSocketClient } from '@/interfaces';

export const wsClients = new Map<WebSocket, WebSocketClient>();
