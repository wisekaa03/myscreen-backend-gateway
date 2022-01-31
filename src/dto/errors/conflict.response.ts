import { ConflictException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/enums/status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class ConflictError extends ConflictException {
  constructor(message?: string, data?: Record<string, unknown>) {
    super({
      status: Status.Error,
      statusCode: 409,
      code: 'server-error.10000',
      message: message ?? 'Conflict exists',
      data,
    });
  }

  @ApiProperty({
    enum: Status,
    example: Status.Error,
    description: 'Статус операции',
    required: true,
  })
  status!: Status.Error;

  @ApiProperty({ required: true, example: 409 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Conflict exists',
  })
  message!: string;
}
