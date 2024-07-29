import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { I18nPath } from '@/i18n';

export class NotFoundError<
  T extends string = I18nPath,
> extends NotFoundException {
  constructor(message?: T, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.NOT_FOUND,
      code: 'server-error.10005',
      message: message ?? 'error.NOT_FOUND',
      options,
    });
    this.initMessage();
  }

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10005' })
  code!: string;

  @ApiProperty({
    required: true,
    example: 'Not Found',
  })
  message!: string;
}
