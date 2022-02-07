import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsNotEmpty } from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { UserEntity } from '@/database/user.entity';

export class UserUpdateRequest extends PartialType(
  PickType(UserEntity, [
    'email',
    'city',
    'company',
    'country',
    'surname',
    'middleName',
    'name',
    'surname',
    'phoneNumber',
  ]),
) {
  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    enumName: 'UserRoleRequest',
    example: UserRoleEnum.Advertiser,
    required: false,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(UserRole)
  role!: UserRoleEnum;
}
