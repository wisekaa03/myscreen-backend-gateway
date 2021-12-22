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
    example: Status.Error,
    description: 'Статус операции',
  })
  status!: Status.Error;

  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10005' })
  code!: string;

  @ApiProperty({
    example: 'Not Found',
  })
  message!: string;
}
