import { ApiProperty } from '@nestjs/swagger';
import {
  IsDefined,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordVerifyRequest {
  @ApiProperty({ example: 'j481y1b' })
  @IsDefined()
  @IsNotEmpty()
  verify!: string;

  @ApiProperty({ example: 'Secret~12345678' })
  @IsDefined()
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(30, { message: 'password is too long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password!: string;
}
