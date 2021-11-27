import type { UserEntity } from '@/database/user.entity';

export const generateMailToken = (user: UserEntity, key: string) =>
  Buffer.from(`${user.email}|${key}`).toString('base64url');

export const decodeMailToken = (token: string) =>
  Buffer.from(token, 'base64url').toString('ascii').split('|');
