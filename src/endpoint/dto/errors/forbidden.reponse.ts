import { ApiProperty } from '@nestjs/swagger';
import { ForbiddenException } from '@nestjs/common';
import { Status } from '../status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class ForbiddenError extends ForbiddenException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 403,
      code: 'server-error.10002',
      message: message ?? 'Forbidden',
    });
  }

  @ApiProperty({ type: Status.Error, example: Status.Error })
  private status: Status;

  @ApiProperty({ type: '403', example: 403 })
  statusCode: number;

  @ApiProperty({ type: 'server-error.10002', example: 'server-error.10002' })
  code: string;

  @ApiProperty({
    example: 'Forbidden',
  })
  message: string;
}
