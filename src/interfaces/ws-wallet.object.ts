import { WsEvent } from '@/enums/ws-event.enum';

export interface WsWalletData {
  total: number;
}

export interface WsWalletObject {
  event: WsEvent;
  data: WsWalletData;
}
