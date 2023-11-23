import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty } from 'class-validator';

import { Token } from '@/interfaces';

export class AuthRefreshRequest {
  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example: 'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.E9jKilfGxxxxxxxxxxxxx',
  })
  @IsDefined({ message: 'the refresh token is required' })
  @IsNotEmpty()
  refreshToken!: Token;
}
