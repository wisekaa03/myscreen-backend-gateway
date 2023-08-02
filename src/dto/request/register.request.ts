import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsNotEmpty } from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { UserExtEntity } from '@/database/user-ext.entity';

export class RegisterRequest extends OmitType(UserExtEntity, [
  'id',
  'disabled',
  'verified',
  'role',
  'password',
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

  @IsDefined()
  @IsNotEmpty()
  password!: string;
}
