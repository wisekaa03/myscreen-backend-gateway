import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, NotAcceptableException } from '@nestjs/common';

import { Status } from '@/enums/status.enum';
import { TranslateOptions } from 'nestjs-i18n';
import { I18nPath } from '@/i18n';

export class NotAcceptableError<
  T extends I18nPath | string = I18nPath,
> extends NotAcceptableException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.NOT_ACCEPTABLE,
      code: 'server-error.10000',
      message: message ?? ('error.NOT_ACCEPTABLE' as I18nPath),
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ example: HttpStatus.NOT_ACCEPTABLE })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Not Acceptable',
  })
  message!: string;
}
