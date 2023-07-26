import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '../../enums/status.enum';

export class ServiceUnavailableError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: 503,
        code: 'server-error.10000',
        message: message ?? 'Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  @ApiProperty({ example: 503 })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Service Unavailable',
  })
  message!: string;
}
