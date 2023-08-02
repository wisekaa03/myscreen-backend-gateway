import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { UserPlanEnum, UserRole, UserRoleEnum } from '@/enums';
import { UserExtEntity } from '@/database/user-ext.entity';

export class UserUpdateRequest extends PartialType(
  PickType(UserExtEntity, [
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
  @IsEnum(UserRole)
  role?: UserRoleEnum;

  @ApiProperty({
    description: 'План пользователя',
    enum: UserPlanEnum,
    enumName: 'UserPlan',
    example: UserPlanEnum.Full,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserPlanEnum)
  plan?: UserPlanEnum;
}
