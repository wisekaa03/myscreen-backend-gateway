import { ApiProperty } from '@nestjs/swagger';
import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { I18nPath } from '@/i18n';

export class ForbiddenError<
  T extends I18nPath | string = I18nPath,
> extends ForbiddenException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.FORBIDDEN,
      code: 'server-error.10002',
      message: message ?? ('error.FORBIDDEN' as I18nPath),
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ required: true, example: HttpStatus.FORBIDDEN })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'Forbidden',
    required: true,
  })
  message!: string;
}
