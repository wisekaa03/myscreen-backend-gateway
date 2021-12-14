import { ApiProperty } from '@nestjs/swagger';
import { ServiceUnavailableException } from '@nestjs/common';
import { Status } from '../status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class ServiceUnavailableError extends ServiceUnavailableException {
  constructor(message?: string) {
    super({
      status: Status.Error,
      statusCode: 503,
      code: 'server-error.10000',
      message: message ?? 'Service Unavailable',
    });
  }

  @ApiProperty({
    type: Status.Error,
    example: Status.Error,
    description: 'Статус операции',
  })
  status!: Status.Error;

  @ApiProperty({ type: '503', example: 503 })
  statusCode!: number;

  @ApiProperty({ type: 'server-error.10000', example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Service Unavailable',
  })
  message!: string;
}
