import { PickType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty } from 'class-validator';
import { UserEntity } from '@/database/user.entity';

export class LoginRequest extends PickType(UserEntity, ['email', 'password']) {
  @IsDefined()
  @IsNotEmpty()
  email!: string;

  @IsDefined()
  @IsNotEmpty()
  password!: string;
}
