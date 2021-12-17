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
    type: Status.Error,
    example: Status.Error,
    description: 'Статус операции',
  })
  status!: Status.Error;

  @ApiProperty({ type: '500', example: 500 })
  statusCode!: number;

  @ApiProperty({ type: 'server-error.10000', example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
  })
  message!: string;
}
