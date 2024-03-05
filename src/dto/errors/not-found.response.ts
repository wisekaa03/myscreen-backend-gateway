import { ApiProperty } from '@nestjs/swagger';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class NotFoundError extends HttpException {
  constructor(message?: string, options?: HttpExceptionOptions) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.NOT_FOUND,
        code: 'server-error.10005',
        message: message ?? 'Not Found',
      },
      HttpStatus.NOT_FOUND,
      options,
    );
  }

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10005' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Not Found',
  })
  message!: string;
}
