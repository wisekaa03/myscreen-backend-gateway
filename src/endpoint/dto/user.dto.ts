import { PickType } from '@nestjs/swagger';
import { UserEntity } from '@/database/user.entity';

export class User extends PickType(UserEntity, [
  'email',
  'city',
  'company',
  'countUsedSpace',
  'country',
  'isDemoUser',
  'middleName',
  'name',
  'surname',
  'phoneNumber',
  'role',
  'verified',
  'disabled',
  'createdAt',
  'updatedAt',
]) {}
