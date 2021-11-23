import { ApiProperty } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { Status } from '../status.enum';

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class UnauthorizedErrorResponse extends UnauthorizedException {
  constructor() {
    super({
      status: Status.Error,
      statusCode: 401,
      code: 'server-error.10001',
      message: 'The authorization token signature is invalid or corrupted',
    });
  }

  @ApiProperty({ type: Status.Error, example: Status.Error })
  private status: Status;

  @ApiProperty({ type: '401', example: 401 })
  statusCode: number;

  @ApiProperty({ type: 'server-error.10001', example: 'server-error.10001' })
  code: string;

  @ApiProperty({
    type: 'The authorization token signature is invalid or corrupted',
    example: 'The authorization token signature is invalid or corrupted',
  })
  message: string;
}
