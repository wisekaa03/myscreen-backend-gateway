import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsNotEmpty } from 'class-validator';

import { UserRole, UserRoleEnum } from '@/enums';
import { UserEntity } from '@/database/user.entity';

export class RegisterRequest extends PickType(UserEntity, [
  'email',
  'password',
  'name',
  'surname',
  'middleName',
  'city',
  'country',
  'company',
  'phoneNumber',
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
