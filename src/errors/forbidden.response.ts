import { ApiProperty } from '@nestjs/swagger';
import { ForbiddenException, HttpStatus } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';

export class ForbiddenError extends ForbiddenException {
  constructor(message?: string, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.FORBIDDEN,
      code: 'server-error.10002',
      message: message ?? 'Forbidden',
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
