import { WsEvent } from '@/enums/ws-event.enum';

export interface WsMetricsData {
  monitors: {
    online: number;
    offline: number;
    empty: number;
    user: number;
  };
  playlists: {
    added: number;
    played: number;
  };
  storageSpace: {
    storage: number;
    total?: number;
  };
}

export interface WsMetricsObject {
  event: WsEvent;
  data: WsMetricsData;
}
