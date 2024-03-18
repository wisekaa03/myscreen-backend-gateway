import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty } from 'class-validator';

import { i18nValidationMessage } from 'nestjs-i18n';
import { Token } from '@/interfaces';

export class AuthRefreshRequest {
  @ApiProperty({
    description: 'Refresh токен, используемый для запросов /api/v2/refresh',
    example: 'exJxcGxiOxJIxzIxNixsIxR5cxxxxxxxxxxx.E9jKilfGxxxxxxxxxxxxx',
  })
  @IsDefined({
    message: i18nValidationMessage('validation.IS_DEFINED_REFRESH'),
  })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  refreshToken!: Token;
}
