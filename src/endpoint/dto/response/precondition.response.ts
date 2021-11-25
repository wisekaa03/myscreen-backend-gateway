import { ApiProperty } from '@nestjs/swagger';
import { PreconditionFailedException } from '@nestjs/common';
import { Status } from '../status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class PreconditionFailedErrorResponse extends PreconditionFailedException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 412,
      code: 'server-error.10002',
      message: message ?? 'Precondition failed',
    });
  }

  @ApiProperty({ type: Status.Error, example: Status.Error })
  private status: Status;

  @ApiProperty({ type: '412', example: 412 })
  statusCode: number;

  @ApiProperty({ type: 'server-error.10002', example: 'server-error.10002' })
  code: string;

  @ApiProperty({
    type: 'Precondition failed',
    example: 'Precondition failed',
  })
  message: string;
}
