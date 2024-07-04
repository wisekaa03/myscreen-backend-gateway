import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';

export class ServiceUnavailableError extends ServiceUnavailableException {
  constructor(message?: string, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'server-error.10000',
      message: message ?? 'Service Unavailable',
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
