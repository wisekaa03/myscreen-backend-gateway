import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, PreconditionFailedException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { I18nPath } from '@/i18n';

export class PreconditionFailedError<
  T extends I18nPath | string = I18nPath,
> extends PreconditionFailedException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.PRECONDITION_FAILED,
      code: 'server-error.10002',
      message: message ?? ('error.PRECONDITION' as I18nPath),
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ required: true, example: HttpStatus.PRECONDITION_FAILED })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10002' })
  code!: string;

  @ApiProperty({
    example: 'User exists',
  })
  message!: string;
}
