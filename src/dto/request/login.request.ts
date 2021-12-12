import { PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { UserEntity } from '@/database/user.entity';

export class LoginRequest extends PickType(UserEntity, ['email', 'password']) {
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  password!: string;
}
