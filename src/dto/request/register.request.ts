import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { i18nValidationMessage } from 'nestjs-i18n';
import { UserRole, UserRoleEnum } from '@/enums';
import { UserEntity } from '@/database/user.entity';

export class RegisterRequest extends PartialType(
  PickType(UserEntity, [
    'name',
    'surname',
    'middleName',
    'phoneNumber',
    'role',
    'city',
    'country',
    'company',
    'email',
    'preferredLanguage',
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
  ]),
) {
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    enumName: 'UserRoleRequest',
    example: UserRoleEnum.Advertiser,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.IS_ENUM') })
  role!: UserRoleEnum;

  @ApiProperty({
    example: 'Secret~12345678',
    description:
      'Пароля пользователя (должен удовлетворять минимальным требованиям)',
    minLength: 8,
    maxLength: 32,
    pattern: '/((?=.*d)|(?=.*W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @MinLength(8, {
    message: i18nValidationMessage('validation.PASSWORD_MIN_LENGTH'),
  })
  @MaxLength(32, {
    message: i18nValidationMessage('validation.PASSWORD_MAX_LENGTH'),
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: i18nValidationMessage('validation.PASSWORD_TOO_WEAK'),
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  password!: string;
}
