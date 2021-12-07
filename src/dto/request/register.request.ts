import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { UserRole, UserRoleEnum } from '@/database/enums/role.enum';

export class RegisterRequest {
  @ApiProperty({ description: 'Почта пользователя', example: 'foo@bar.baz' })
  @IsEmail()
  email!: string;

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
  password!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRoleEnum.Advertiser,
    description: 'Роль пользователя',
  })
  @IsEnum(UserRole)
  role!: UserRoleEnum;

  @ApiProperty({ required: false, description: 'Имя', example: 'John' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, description: 'Фамилия', example: 'Steve' })
  @IsString()
  @IsOptional()
  surname?: string;

  @ApiProperty({ required: false, description: 'Отчество', example: 'Doe' })
  @IsString()
  @IsOptional()
  middleName?: string;

  @ApiProperty({ required: false, description: 'Город', example: 'Krasnodar' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false, description: 'Страна', example: 'RU' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    required: false,
    description: 'Компания',
    example: 'ACME corporation',
  })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({
    required: false,
    description: 'Номер телефона',
    example: '+78002000000',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
