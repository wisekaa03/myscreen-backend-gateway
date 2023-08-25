/**
 * {
 *   "event": "monitor",
 *   "data": {
 *     "playlistPlayed": "...true или false..."
 *   }
 * }
 */
export interface MonitorEvent {
  playlistPlayed: boolean;
}
