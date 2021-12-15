import { Request } from 'express';
import { UserEntity } from '@/database/user.entity';
import { UserSizeEntity } from '@/database/user.view.entity';

declare module 'express' {
  export interface Request {
    user: UserEntity & Partial<UserSizeEntity>;
  }
}
