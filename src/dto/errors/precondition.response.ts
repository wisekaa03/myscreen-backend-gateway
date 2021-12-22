import { ApiProperty } from '@nestjs/swagger';
import { PreconditionFailedException } from '@nestjs/common';
import { Status } from '@/enums/status.enum';

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

  @ApiProperty({
    enum: Status,
    example: Status.Error,
    description: 'Статус операции',
  })
  status!: Status.Error;

  @ApiProperty({ example: 412 })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'User exists',
  })
  message!: string;
}
