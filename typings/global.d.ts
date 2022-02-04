import { Request } from 'express';
import { UserRoleEnum } from '@/enums';

declare module 'express' {
  export interface Request {
    user: {
      id: string;
      role: UserRoleEnum[];
    };
  }
}
