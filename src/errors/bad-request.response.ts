import { ApiProperty } from '@nestjs/swagger';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class BadRequestError extends HttpException {
  constructor(message?: string, options?: HttpExceptionOptions) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'server-error.10004',
        message: message ?? 'Bad request',
      },
      HttpStatus.BAD_REQUEST,
      options,
    );
  }

  @ApiProperty({ required: true, example: HttpStatus.BAD_REQUEST })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10004' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Bad request',
  })
  message!: string;
}
