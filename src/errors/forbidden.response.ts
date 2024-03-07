import { ApiProperty } from '@nestjs/swagger';
import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class ForbiddenError extends HttpException {
  constructor(message?: string, options?: HttpExceptionOptions) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.FORBIDDEN,
        code: 'server-error.10002',
        message: message ?? 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
      options,
    );
  }

  @ApiProperty({ required: true, example: HttpStatus.FORBIDDEN })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'Forbidden',
    required: true,
  })
  message!: string;
}
