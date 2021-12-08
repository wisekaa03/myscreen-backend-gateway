import { PickType } from '@nestjs/swagger';

import { IsDefined } from 'class-validator';
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
  @IsDefined()
  email!: string;

  @IsDefined()
  password!: string;

  @IsDefined()
  role!: UserRoleEnum;
}
