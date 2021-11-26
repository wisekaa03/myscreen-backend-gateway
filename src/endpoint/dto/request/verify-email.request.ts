import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({ example: 'j481y1b' })
  @IsString()
  @IsNotEmpty()
  verify_email: string;
}
