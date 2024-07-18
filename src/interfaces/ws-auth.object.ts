import { WsEvent } from '@/enums/ws-event.enum';

export interface WsAuthData {
  total: number;
}

export interface WsAuthObject {
  event: WsEvent;
  data: WsAuthData;
}
