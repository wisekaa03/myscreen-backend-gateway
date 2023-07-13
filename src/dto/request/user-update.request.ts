import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { UserEntity } from '@/database/user.entity';

export class UserUpdateRequest extends PartialType(
  PickType(UserEntity, [
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
}
