import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class PreconditionFailedError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.PRECONDITION_FAILED,
        code: 'server-error.10002',
        message: message ?? 'User exists',
      },
      HttpStatus.PRECONDITION_FAILED,
    );
  }

  @ApiProperty({ required: true, example: HttpStatus.PRECONDITION_FAILED })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'User exists',
  })
  message!: string;
}
