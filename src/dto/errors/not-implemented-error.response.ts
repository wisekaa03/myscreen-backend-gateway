import { ApiProperty } from '@nestjs/swagger';
import { NotImplementedException } from '@nestjs/common';
import { Status } from '@/enums/status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class NotImplementedError extends NotImplementedException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 501,
      code: 'server-error.10000',
      message: message ?? 'Not implemented',
    });
  }

  @ApiProperty({
    enum: Status,
    enumName: 'Status',
    example: Status.Error,
    description: 'Статус операции',
    required: true,
  })
  status!: Status.Error;

  @ApiProperty({ required: true, example: 501 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
    required: true,
  })
  message!: string;
}
