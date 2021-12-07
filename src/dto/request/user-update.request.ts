import { PickType } from '@nestjs/swagger';

import { UserEntity } from '@/database/user.entity';

export class UserUpdateRequest extends PickType(UserEntity, [
  'email',
  'city',
  'company',
  'surname',
  'middleName',
  'name',
  'surname',
  'phoneNumber',
  'role',
]) {}
