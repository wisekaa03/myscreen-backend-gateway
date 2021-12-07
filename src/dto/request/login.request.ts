import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginRequest {
  @ApiProperty({ description: 'Почта пользователя', example: 'foo@bar.baz' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Пароля пользователя (должен удовлетворять минимальным требованиям)',
    example: 'Secret~12345678',
    minLength: 8,
    maxLength: 30,
    pattern: '/((?=.*d)|(?=.*W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(30, { message: 'password is too long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password!: string;
}
