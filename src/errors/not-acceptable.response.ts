import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, NotAcceptableException } from '@nestjs/common';

import { Status } from '@/enums/status.enum';
import { TranslateOptions } from 'nestjs-i18n';

export class NotAcceptableError extends NotAcceptableException {
  constructor(message?: string, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.NOT_ACCEPTABLE,
      code: 'server-error.10000',
      message: message ?? 'NOT_ACCEPTABLE',
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
