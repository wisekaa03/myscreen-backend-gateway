import { PartialType, PickType } from '@nestjs/swagger';

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
    'role',
  ]),
) {}
