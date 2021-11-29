import { ApiProperty } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import { Status } from '../status.enum';

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
    type: Status.Error,
    example: Status.Error,
    description: 'Статус операции',
  })
  status: Status.Error;

  @ApiProperty({ type: '400', example: 400 })
  statusCode: number;

  @ApiProperty({ type: 'server-error.10004', example: 'server-error.10004' })
  code: string;

  @ApiProperty({
    example: 'Bad request',
  })
  message: string;
}
