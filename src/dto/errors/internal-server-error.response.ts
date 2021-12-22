import { ApiProperty } from '@nestjs/swagger';
import { InternalServerErrorException } from '@nestjs/common';
import { Status } from '@/enums/status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class InternalServerError extends InternalServerErrorException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 500,
      code: 'server-error.10000',
      message: message ?? 'Server error',
    });
  }

  @ApiProperty({
    enum: Status,
    example: Status.Error,
    description: 'Статус операции',
  })
  status!: Status.Error;

  @ApiProperty({ example: 500 })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
  })
  message!: string;
}
