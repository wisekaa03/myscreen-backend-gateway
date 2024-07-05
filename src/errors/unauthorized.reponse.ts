import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';

export class UnauthorizedError extends UnauthorizedException {
  constructor(message?: string, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.UNAUTHORIZED,
      code: 'server-error.10001',
      message: message ?? 'UNAUTHORIZED',
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ example: HttpStatus.UNAUTHORIZED })
  statusCode!: number;

  @ApiProperty({ example: 'server-error.10001' })
  code!: string;

  @ApiProperty({
    example: 'Unauthorized request',
  })
  message!: string;
}
