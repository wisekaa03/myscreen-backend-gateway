import { ApiProperty } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { Status } from '@/enums/status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class UnauthorizedError extends UnauthorizedException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 401,
      code: 'server-error.10001',
      message: message ?? 'Unauthorized request',
    });
  }

  @ApiProperty({
    enum: Status,
    example: Status.Error,
    description: 'Статус операции',
    required: true,
  })
  status!: Status.Error;

  @ApiProperty({ example: 401 })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10001' })
  code!: string;

  @ApiProperty({
    example: 'Unauthorized request',
  })
  message!: string;
}
