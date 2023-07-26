import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '../../enums/status.enum';

export class NotImplementedError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: 501,
        code: 'server-error.10000',
        message: message ?? 'Not implemented',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiProperty({ required: true, example: 501 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
    required: true,
  })
  message!: string;
}
