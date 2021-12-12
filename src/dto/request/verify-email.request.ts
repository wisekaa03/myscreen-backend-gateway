import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class VerifyEmailRequest {
  @ApiProperty({ example: 'j481y1b' })
  @IsNotEmpty()
  verify_email!: string;
}
