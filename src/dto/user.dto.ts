import { PickType } from '@nestjs/swagger';
import { UserEntity } from '@/database/user.entity';
import { UserSizeEntity } from '@/database/user.view.entity';

export class User extends PickType(UserSizeEntity, [
  'id',
  'email',
  'city',
  'company',
  'countUsedSpace',
  'country',
  'isDemoUser',
  'middleName',
  'name',
  'surname',
  'phoneNumber',
  'role',
  'verified',
  'createdAt',
  'updatedAt',
]) {}

export const userEntityToUser = ({
  disabled,
  forgotConfirmKey,
  emailConfirmKey,
  password,
  monitors,
  ...data
}: UserEntity & Partial<UserSizeEntity>): Partial<UserEntity> &
  Partial<UserSizeEntity> => data;
