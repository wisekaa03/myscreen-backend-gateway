import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsEmail, IsOptional } from 'class-validator';

import { UserRole, UserRoleEnum } from '@/database/enums/role.enum';

export class UserUpdateRequest {
  @ApiProperty({
    required: false,
    description: 'Почта пользователя',
    example: 'foo@bar.baz',
  })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({
    required: false,
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRoleEnum.Advertiser,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role: UserRoleEnum;

  @ApiProperty({ required: false, description: 'Имя', example: 'John' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Фамилия', example: 'Steve' })
  @IsOptional()
  @IsString()
  surname: string;

  @ApiProperty({ required: false, description: 'Отчество', example: 'Doe' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ required: false, description: 'Город', example: 'Krasnodar' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, description: 'Страна', example: 'RU' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    required: false,
    description: 'Компания',
    example: 'ACME corporation',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({
    required: false,
    description: 'Номер телефона',
    example: '+78002000000',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
