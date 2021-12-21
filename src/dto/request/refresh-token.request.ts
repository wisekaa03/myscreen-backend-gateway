import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty } from 'class-validator';

export class RefreshTokenRequest {
  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example: 'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.E9jKilfGxxxxxxxxxxxxx',
  })
  @IsDefined({ message: 'the refresh token is required' })
  @IsNotEmpty()
  refresh_token!: string;
}
