/**
 * {
 *   "event": "monitor",
 *   "data": {
 *     "playlistPlayed": "...true или false..."
 *   }
 * }
 */
export interface WsMonitorEvent {
  playlistId: string;
  playlistPlayed: boolean;
}
