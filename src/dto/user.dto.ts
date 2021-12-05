import { PickType } from '@nestjs/swagger';
import { UserEntity } from '@/database/user.entity';

export class User extends PickType(UserEntity, [
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
}: UserEntity): User => data;
