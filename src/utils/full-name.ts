import { UserEntity } from '@/database/user.entity';

/**
 * Return full name of user.
 * @param {UserEntity} user UserEntity
 * @param {boolean} isEmail (default: true) - add email
 * @returns string
 */
export const fullNameFunc = (user: UserEntity, isEmail = true) =>
  [user.surname, user.name, user.middleName].join(' ') +
  (isEmail ? ` <${user.email}>` : '');
