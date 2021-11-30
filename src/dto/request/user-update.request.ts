import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsEmail } from 'class-validator';

import { UserRole } from '@/database/enums/role.enum';

export class UserUpdateRequest {
  @ApiProperty({ description: 'Почта пользователя', example: 'foo@bar.baz' })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Роль пользователя',
    enum: UserRole,
    example: UserRole.Advertiser,
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
