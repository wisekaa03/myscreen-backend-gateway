import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '../../enums/status.enum';

export class NotFoundError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: 404,
        code: 'server-error.10005',
        message: message ?? 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }

  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10005' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Not Found',
  })
  message!: string;
}
