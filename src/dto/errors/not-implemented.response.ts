import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class NotImplementedError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.NOT_IMPLEMENTED,
        code: 'server-error.10000',
        message: message ?? 'Not implemented',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }

  @ApiProperty({ required: true, example: HttpStatus.NOT_IMPLEMENTED })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
    required: true,
  })
  message!: string;
}
