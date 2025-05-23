import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { I18nPath } from '@/i18n';

export class UnauthorizedError<
  T extends I18nPath | string = I18nPath,
> extends UnauthorizedException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.UNAUTHORIZED,
      code: 'server-error.10001',
      message: message ?? ('error.UNAUTHORIZED' as I18nPath),
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ example: HttpStatus.UNAUTHORIZED })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10001' })
  code!: string;

  @ApiProperty({
    example: 'Unauthorized request',
  })
  message!: string;
}
