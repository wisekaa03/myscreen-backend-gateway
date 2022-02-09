import { ApiProperty } from '@nestjs/swagger';
import { ForbiddenException } from '@nestjs/common';
import { Status } from '@/enums/status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class ForbiddenError extends ForbiddenException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 403,
      code: 'server-error.10002',
      message: message ?? 'Forbidden',
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

  @ApiProperty({ required: true, example: 403 })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'Forbidden',
    required: true,
  })
  message!: string;
}
