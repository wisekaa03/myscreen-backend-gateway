import { ApiProperty } from '@nestjs/swagger';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class InternalServerError extends HttpException {
  constructor(message?: string, options?: HttpExceptionOptions) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'server-error.10000',
        message: message ?? 'Server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
      options,
    );
  }

  @ApiProperty({ required: true, example: HttpStatus.INTERNAL_SERVER_ERROR })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
    required: true,
  })
  message!: string;
}
