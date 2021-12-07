import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsEmail, IsOptional } from 'class-validator';

import { UserRole, UserRoleEnum } from '@/database/enums/role.enum';

export class UserUpdateRequest {
  @ApiProperty({
    required: false,
    description: 'Почта пользователя',
    example: 'foo@bar.baz',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    required: false,
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRoleEnum.Advertiser,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRoleEnum;

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
