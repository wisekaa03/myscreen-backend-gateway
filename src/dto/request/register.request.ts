import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole } from '@/database/enums/role.enum';

export class RegisterRequest {
  @ApiProperty({ description: 'Почта пользователя', example: 'foo@bar.baz' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Secret~12345678',
    description:
      'Пароля пользователя (должен удовлетворять минимальным требованиям)',
    minLength: 8,
    maxLength: 30,
    pattern: '/((?=.*d)|(?=.*W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',
  })
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(30, { message: 'password is too long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;

  @ApiProperty({
    enum: Object.values(UserRole).filter(
      (role) => role !== UserRole.Administrator,
    ),
    example: UserRole.Advertiser,
    description: 'Роль пользователя',
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, description: 'Имя', example: 'John' })
  @IsString()
  name: UserRole;

  @ApiProperty({ required: false, description: 'Фамилия', example: 'Steve' })
  @IsString()
  surname: UserRole;

  @ApiProperty({ required: false, description: 'Отчество', example: 'Doe' })
  @IsString()
  middleName?: UserRole;

  @ApiProperty({ required: false, description: 'Страна', example: 'RU' })
  country?: string;

  @ApiProperty({
    required: false,
    description: 'Компания',
    example: 'Acme company',
  })
  company?: string;

  @ApiProperty({
    required: false,
    description: 'Номер телефона',
    example: '+78002000000',
  })
  phoneNumber?: string;
}
