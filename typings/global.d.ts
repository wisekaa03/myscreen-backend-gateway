import { UserExtView } from '@/database/user-ext.view';

declare module 'express' {
  export interface Request {
    user: UserExtView;
  }
}
