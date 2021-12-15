import { PickType } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';
import { UserEntity } from '@/database/user.entity';

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
  password!: string;
}
