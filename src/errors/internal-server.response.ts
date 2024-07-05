import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';

export class InternalServerError extends InternalServerErrorException {
  constructor(message?: any, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'server-error.10000',
      message: message ?? 'SERVER_ERROR',
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ required: true, example: HttpStatus.INTERNAL_SERVER_ERROR })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
    required: true,
  })
  message!: string;
}
