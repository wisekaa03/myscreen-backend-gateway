import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty } from 'class-validator';

export class VerifyEmailRequest {
  @ApiProperty({ example: 'j481y1b' })
  @IsDefined()
  @IsNotEmpty()
  verify_email!: string;
}
