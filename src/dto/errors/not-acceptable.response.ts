import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class NotAcceptableError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.NOT_ACCEPTABLE,
        code: 'server-error.10000',
        message: message ?? 'Not Acceptable',
      },
      HttpStatus.NOT_ACCEPTABLE,
    );
  }

  @ApiProperty({ example: HttpStatus.NOT_ACCEPTABLE })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Not Acceptable',
  })
  message!: string;
}
