import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { UserExtEntity } from '@/database/user.view.entity';

export class UserUpdateRequest extends PartialType(
  PickType(UserExtEntity, [
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
    'disabled',
    'isDemoUser',
    'verified',
    'wallet',
    'countUsedSpace',
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
}
