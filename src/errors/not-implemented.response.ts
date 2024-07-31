import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, NotImplementedException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { I18nPath } from '@/i18n';

export class NotImplementedError<
  T extends I18nPath | string = I18nPath,
> extends NotImplementedException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.NOT_IMPLEMENTED,
      code: 'server-error.10000',
      message: message ?? ('error.NOT_IMPLEMENTED' as I18nPath),
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ required: true, example: HttpStatus.NOT_IMPLEMENTED })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Server error',
    required: true,
  })
  message!: string;
}
