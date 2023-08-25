/**
 * {
 *   "event": "auth/token",
 *   "data": {
 *     "token": "...То, что мы получили через http://localhost:3000/api/v2/auth/monitor...",
 *     "date": "...Текущая дата..."
 *   }
 * }
 */
export interface AuthTokenEvent {
  token: string;
  date: string;
}
