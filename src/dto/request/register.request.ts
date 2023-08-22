import { ApiProperty, OmitType } from '@nestjs/swagger';
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { UserExtEntity } from '@/database/user-ext.entity';

export class RegisterRequest extends OmitType(UserExtEntity, [
  'id',
  'disabled',
  'verified',
  'role',
  'plan',
  'password',
  'wallet',
  'walletSum',
  'countMonitors',
  'countUsedSpace',
  'emailConfirmKey',
  'forgotConfirmKey',
  'monitors',
  'metrics',
  'planValidityPeriod',
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    enumName: 'UserRoleRequest',
    example: UserRoleEnum.Advertiser,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRoleEnum;

  @ApiProperty({
    example: 'Secret~12345678',
    description:
      'Пароля пользователя (должен удовлетворять минимальным требованиям)',
    minLength: 8,
    maxLength: 30,
    pattern: '/((?=.*d)|(?=.*W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(30, { message: 'password is too long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  @IsDefined()
  @IsNotEmpty()
  password!: string;
}
