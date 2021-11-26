import type { UserEntity } from '@/database/user.entity';

export const generateMailToken = (user: UserEntity, key: string) =>
  encodeURIComponent(Buffer.from(`${user.email}==${key}`).toString('base64'));

export const decodeMailToken = (token: string) =>
  decodeURIComponent(Buffer.from(token, 'base64').toString('utf-8')).split(
    '==',
  );
