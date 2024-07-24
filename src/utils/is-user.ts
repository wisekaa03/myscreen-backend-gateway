import { UserEntity } from '../database/user.entity';

export const isUser = (user: any): user is UserEntity => {
  return (
    typeof user === 'object' &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string'
  );
};
