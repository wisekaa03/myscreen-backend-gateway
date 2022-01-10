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
    required: true,
  })
  status!: Status.Error;

  @ApiProperty({ required: true, example: 400 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10004' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Bad request',
  })
  message!: string;
}
