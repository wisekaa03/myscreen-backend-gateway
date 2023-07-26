import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '../../enums/status.enum';

export class ForbiddenError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: 403,
        code: 'server-error.10002',
        message: message ?? 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
    );
  }

  @ApiProperty({ required: true, example: 403 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'Forbidden',
    required: true,
  })
  message!: string;
}
