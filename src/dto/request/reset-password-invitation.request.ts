import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResetPasswordInvitationRequest {
  @ApiProperty({
    example: 'foo@bar.baz',
  })
  @IsEmail()
  email: string;
}
