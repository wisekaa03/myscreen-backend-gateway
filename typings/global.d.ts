import { UserResponse } from '@/dto';

declare module 'express' {
  export interface Request {
    user: UserResponse;
  }
}
