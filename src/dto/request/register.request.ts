import { PickType } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';
import { UserEntity } from '@/database/user.entity';
import { UserRoleEnum } from '@/database/enums/role.enum';

export class RegisterRequest extends PickType(UserEntity, [
  'email',
  'password',
  'role',
  'name',
  'surname',
  'middleName',
  'city',
  'country',
  'company',
  'phoneNumber',
]) {
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  password!: string;

  @IsNotEmpty()
  role!: UserRoleEnum;
}
