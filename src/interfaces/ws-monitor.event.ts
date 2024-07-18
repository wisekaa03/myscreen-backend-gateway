/**
 * {
 *   "event": "monitor",
 *   "data": {
 *     "playlistPlayed": "...true или false..."
 *   }
 * }
 */
export interface WsMonitorEvent {
  playlistPlayed: boolean;
}
