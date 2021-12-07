import { Request } from 'express';
import { UserEntity } from '@/database/user.entity';

declare module 'express' {
  export interface Request {
    user: UserEntity;
  }
}
