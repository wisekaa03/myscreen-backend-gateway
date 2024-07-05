import { ApiProperty } from '@nestjs/swagger';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';

export class BadRequestError extends BadRequestException {
  constructor(message?: string, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'server-error.10004',
      message: message ?? 'BAD_REQUEST',
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ required: true, example: HttpStatus.BAD_REQUEST })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10004' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Bad request',
  })
  message!: string;
}
