import { ApiProperty } from '@nestjs/swagger';
import { PreconditionFailedException } from '@nestjs/common';
import { Status } from '../status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class PreconditionFailedError extends PreconditionFailedException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 412,
      code: 'server-error.10002',
      message: message ?? 'User exists',
    });
  }

  @ApiProperty({ type: Status.Error, example: Status.Error })
  status: Status.Error;

  @ApiProperty({ type: '412', example: 412 })
  statusCode: number;

  @ApiProperty({ type: 'server-error.10002', example: 'server-error.10002' })
  code: string;

  @ApiProperty({
    example: 'User exists',
  })
  message: string;
}
