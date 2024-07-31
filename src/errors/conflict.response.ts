import { HttpStatus, ConflictException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { TranslateOptions } from 'nestjs-i18n';

import { Status } from '@/enums/status.enum';
import { FileIDResponse } from '@/dto/response/file-id.response';
import { I18nPath } from '@/i18n';

export class ConflictDataFile {
  @ApiProperty({
    description: 'ID ссылки',
    format: 'uuid',
    required: false,
  })
  id!: string;

  @ApiProperty({
    description: 'Имя ссылки',
    required: false,
    example: 'Имя ссылки',
  })
  name?: string;

  @ApiProperty({
    type: () => FileIDResponse,
    description: 'Файл',
    required: false,
  })
  file?: FileIDResponse;
}

export class ConflictData {
  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Редакторы (видео)',
    isArray: true,
    required: false,
  })
  video?: ConflictDataFile[];

  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Редакторы (аудио)',
    isArray: true,
    required: false,
  })
  audio?: ConflictDataFile[];

  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Плэйлисты',
    isArray: true,
    required: false,
  })
  playlist?: ConflictDataFile[];

  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Мониторы',
    isArray: true,
    required: false,
  })
  monitor?: ConflictDataFile[];

  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Файлы',
    isArray: true,
    required: false,
  })
  files?: ConflictDataFile[];
}

export class ConflictError<
  T extends I18nPath | string = I18nPath,
> extends ConflictException {
  constructor(message: T, options?: TranslateOptions, error?: ConflictData) {
    super({
      status: Status.Error,
      statusCode: HttpStatus.CONFLICT,
      code: 'server-error.10000',
      message: message ?? ('error.CONFLICT' as I18nPath),
      options,
      error,
    });
    this.initMessage();
  }

  @ApiProperty({ required: true, example: HttpStatus.CONFLICT })
  statusCode!: number;

  @ApiProperty({ required: true, example: 'server-error.10000' })
  code!: string;

  @ApiProperty({
    example: 'Conflict exists',
  })
  message!: string;

  @ApiProperty({
    type: () => ConflictData,
    required: true,
  })
  error!: ConflictData;
}
