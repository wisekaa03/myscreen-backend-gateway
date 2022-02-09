import { ApiProperty } from '@nestjs/swagger';
import { NotFoundException } from '@nestjs/common';
import { Status } from '@/enums/status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class NotFoundError extends NotFoundException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 404,
      code: 'server-error.10005',
      message: message ?? 'Not Found',
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

  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10005' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Not Found',
  })
  message!: string;
}
