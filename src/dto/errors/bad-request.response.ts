import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class BadRequestError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'server-error.10004',
        message: message ?? 'Bad request',
      },
      HttpStatus.BAD_REQUEST,
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
