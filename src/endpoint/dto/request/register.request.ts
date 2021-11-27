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
  @ApiProperty({ example: 'foo@bar.baz' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Secret~12345678' })
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(30, { message: 'password is too long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.Advertiser,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false, example: 'John' })
  @IsString()
  name: UserRole;

  @ApiProperty({ required: false, example: 'Steve' })
  @IsString()
  surname: UserRole;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsString()
  middleName?: UserRole;

  @ApiProperty({ required: false, example: 'RU' })
  country?: string;

  @ApiProperty({ required: false, example: 'Acme company' })
  company?: string;

  @ApiProperty({ required: false, example: '+78002000000' })
  phoneNumber?: string;
}
