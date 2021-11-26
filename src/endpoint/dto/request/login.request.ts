import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'foo@bar.baz' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret' })
  @MinLength(8, { message: 'password is too short' })
  password: string;
}
