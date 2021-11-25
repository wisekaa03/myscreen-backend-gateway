import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

import { UserRole } from '@/database/enums/role.enum';

export class RegisterRequestDto {
  @ApiProperty({ example: 'foo@bar.baz' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret' })
  @MinLength(8, { message: 'Password is too short' })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.Advertiser,
  })
  @IsString()
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
