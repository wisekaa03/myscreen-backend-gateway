import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenRequest {
  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example: 'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.E9jKilfGxxxxxxxxxxxxx',
  })
  @IsNotEmpty({ message: 'the refresh token is required' })
  refresh_token!: string;
}
