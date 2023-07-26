import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '../../enums/status.enum';

export class PreconditionFailedError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: 412,
        code: 'server-error.10002',
        message: message ?? 'User exists',
      },
      HttpStatus.PRECONDITION_FAILED,
    );
  }

  @ApiProperty({ required: true, example: 412 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'User exists',
  })
  message!: string;
}
