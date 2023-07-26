import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class InternalServerError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: 500,
        code: 'server-error.10000',
        message: message ?? 'Server error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  @ApiProperty({ required: true, example: 500 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
    required: true,
  })
  message!: string;
}
