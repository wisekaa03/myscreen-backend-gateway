import { UserRequest } from '@/dto';
import { UserResponse } from '@/database/user-response.entity';
import { UserEntity } from '@/database/user.entity';

/**
 * Return full name of user.
 * @param {UserEntity} user UserEntity
 * @param {boolean} isEmail (default: true) - add email
 * @returns string
 */
export const getFullName = (
  user: UserEntity | UserResponse | UserRequest,
  isEmail = true,
) =>
  [user.surname, user.name, user.middleName].join(' ') +
  (isEmail ? ` <${user.email}>` : '');
