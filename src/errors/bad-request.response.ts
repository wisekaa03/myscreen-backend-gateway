import { ApiProperty } from '@nestjs/swagger';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { I18nPath } from '@/i18n';

export class BadRequestError<
  T extends string = I18nPath,
> extends BadRequestException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'server-error.10004',
      message: message ?? 'error.BAD_REQUEST',
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
