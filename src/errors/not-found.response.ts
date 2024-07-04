import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';

export class NotFoundError extends NotFoundException {
  constructor(message?: any, options?: TranslateOptions) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.NOT_FOUND,
      code: 'server-error.10005',
      message: message ?? 'Not Found',
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
