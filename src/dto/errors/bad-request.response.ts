import { ApiProperty } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { Status } from '@/enums/status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class BadRequestError extends BadRequestException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 400,
      code: 'server-error.10004',
      message: message ?? 'Bad request',
    });
  }

  @ApiProperty({
    enum: Status,
    example: Status.Error,
    description: 'Статус операции',
  })
  status!: Status.Error;

  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10004' })
  code!: string;

  @ApiProperty({
    example: 'Bad request',
  })
  message!: string;
}
