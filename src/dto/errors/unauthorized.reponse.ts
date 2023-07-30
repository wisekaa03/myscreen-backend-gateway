import { ApiProperty } from '@nestjs/swagger';
import { HttpException, HttpStatus } from '@nestjs/common';

import { Status } from '@/enums/status.enum';

export class UnauthorizedError extends HttpException {
  constructor(message?: string) {
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'server-error.10001',
        message: message ?? 'Unauthorized request',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  @ApiProperty({ example: HttpStatus.UNAUTHORIZED })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10001' })
  code!: string;

  @ApiProperty({
    example: 'Unauthorized request',
  })
  message!: string;
}
