import { Request } from 'express';
import { UserSizeEntity } from '@/database/user.view.entity';

declare module 'express' {
  export interface Request {
    user: UserSizeEntity;
  }
}
