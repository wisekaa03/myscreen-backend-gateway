import { ApiProperty } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { Status } from '../status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class UnauthorizedError extends UnauthorizedException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 401,
      code: 'server-error.10001',
      message: message ?? 'Unauthorized request',
    });
  }

  @ApiProperty({ type: Status.Error, example: Status.Error })
  status: Status.Error;

  @ApiProperty({ type: '401', example: 401 })
  statusCode: number;

  @ApiProperty({ type: 'server-error.10001', example: 'server-error.10001' })
  code: string;

  @ApiProperty({
    example: 'Unauthorized request',
  })
  message: string;
}
