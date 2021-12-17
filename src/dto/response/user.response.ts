import { OmitType } from '@nestjs/swagger';
import { UserEntity } from '@/database/user.entity';
import { UserSizeEntity } from '@/database/user.view.entity';

export class UserResponse extends OmitType(UserSizeEntity, [
  'disabled',
  'forgotConfirmKey',
  'emailConfirmKey',
  'password',
  'monitors',
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
