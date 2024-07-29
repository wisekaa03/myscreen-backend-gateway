import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { I18nPath } from '@/i18n';

export class ServiceUnavailableError<
  T extends string = I18nPath,
> extends ServiceUnavailableException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'server-error.10000',
      message: message ?? 'error.SERVICE_UNAVAILABLE',
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ example: HttpStatus.SERVICE_UNAVAILABLE })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Service Unavailable',
  })
  message!: string;
}
