import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailRequest {
  @ApiProperty({ example: 'j481y1b' })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  verify_email!: string;
}
