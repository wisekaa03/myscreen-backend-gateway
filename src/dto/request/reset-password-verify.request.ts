import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordVerifyRequest {
  @ApiProperty({ example: 'j481y1b' })
  @IsNotEmpty()
  verify_code!: string;

  @ApiProperty({ example: 'Secret~12345678' })
  @MinLength(8, { message: 'password is too short' })
  @MaxLength(30, { message: 'password is too long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password!: string;
}
