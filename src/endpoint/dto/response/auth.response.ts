import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { User } from '@/dto/user.dto';

export class AuthenticationPayload {
  @ApiProperty({ example: 'bearer' })
  type: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2Mzc4NTMzM...',
  })
  token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2Mzc4NTc4O...',
    required: false,
  })
  refresh_token?: string;
}

export class AuthResponseDto {
  @ApiProperty({ enum: Status, example: Status.Success })
  status: Status;

  @ApiProperty({ description: 'Возвращаемый токен' })
  payload?: AuthenticationPayload;

  @ApiProperty()
  data: User;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'Возвращаемый токен' })
  token?: string;
}
