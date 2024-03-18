import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { i18nValidationMessage } from 'nestjs-i18n';
import { UserPlanEnum, UserRole, UserRoleEnum } from '@/enums';
import { UserRequest } from './user.request';

export class UserUpdateRequest extends PartialType(
  PickType(UserRequest, [
    'disabled',
    'verified',
    'email',
    'city',
    'country',
    'surname',
    'middleName',
    'name',
    'surname',
    'phoneNumber',
    'company',
    'companyActualAddress',
    'companyLegalAddress',
    'companyTIN',
    'companyRRC',
    'companyPSRN',
    'companyPhone',
    'companyCorrespondentAccount',
    'companyBIC',
    'companyBank',
    'companyPaymentAccount',
    'companyEmail',
    'companyRepresentative',
    'companyFax',
  ]),
) {
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    enumName: 'UserRoleRequest',
    example: UserRoleEnum.Advertiser,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.IS_ENUM') })
  role?: UserRoleEnum;

  @ApiProperty({
    description: 'План пользователя',
    enum: UserPlanEnum,
    enumName: 'UserPlan',
    example: UserPlanEnum.Full,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserPlanEnum, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  plan?: UserPlanEnum;
}
