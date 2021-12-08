import { PickType } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';
import { UserEntity } from '../../database/user.entity';

export class LoginRequest extends PickType(UserEntity, ['email', 'password']) {
  @IsDefined()
  email!: string;

  @IsDefined()
  password!: string;
}
