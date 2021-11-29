import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenRequest {
  @ApiProperty({
    description: 'Refresh токен',
    example:
      'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.eyJpYXQiOjE2MzgyMDI2MxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxIn0.E9jKilfGxxxxxxxxxxxxxOlP-GvhkxxxxxxxxxxNw0o',
  })
  @IsNotEmpty({ message: 'the refresh token is required' })
  refresh_token: string;
}
