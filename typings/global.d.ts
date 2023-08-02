import { Request } from 'express';
import { UserExtEntity } from '@/database/user-ext.entity';

declare module 'express' {
  export interface Request {
    user: UserExtEntity;
  }
}
