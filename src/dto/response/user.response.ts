import { OmitType } from '@nestjs/swagger';
import { FindOptionsSelect } from 'typeorm';

import { UserEntity } from '../../database/user.entity';
import { UserSizeEntity } from '../../database/user.view.entity';

export const selectUserOptions: FindOptionsSelect<UserEntity> = {
  id: true,
  email: true,
  disabled: true,
  surname: true,
  name: true,
  middleName: true,
  phoneNumber: true,
  city: true,
  country: true,
  company: true,
  storageSpace: true,
  isDemoUser: true,
  role: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
};

export class UserResponse extends OmitType(UserSizeEntity, [
  'forgotConfirmKey',
  'emailConfirmKey',
  'password',
  'monitors',
]) {}

export const userEntityToUser = ({
  forgotConfirmKey,
  emailConfirmKey,
  password,
  monitors,
  ...data
}: UserEntity & Partial<UserSizeEntity>): Partial<UserEntity> &
  Partial<UserSizeEntity> => data;
