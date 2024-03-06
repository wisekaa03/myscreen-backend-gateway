import { ApiProperty } from '@nestjs/swagger';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class ServiceUnavailableError extends HttpException {
  constructor(message?: string, options?: HttpExceptionOptions) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'server-error.10000',
        message: message ?? 'Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
      options,
    );
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
