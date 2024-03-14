import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { UserEntity } from '@/database/user.entity';

export class RegisterRequest extends PickType(UserEntity, [
  'name',
  'surname',
  'middleName',
  'phoneNumber',
  'role',
  'city',
  'country',
  'company',
  'email',
  'storageSpace',
  'companyActualAddress',
  'companyBIC',
  'companyBank',
  'companyCorrespondentAccount',
  'companyEmail',
  'companyFax',
  'companyLegalAddress',
  'companyPSRN',
  'companyPaymentAccount',
  'companyPhone',
  'companyRRC',
  'companyRepresentative',
  'companyTIN',
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
