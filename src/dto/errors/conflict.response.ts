import {
  HttpException,
  HttpStatus,
  HttpExceptionOptions,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { FileIDResponse } from '@/dto/response/file-id.response';

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
  message!: string;

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
}

export class ConflictError extends HttpException {
  constructor(
    message: string,
    options?: HttpExceptionOptions,
    error?: ConflictData,
  ) {
    const { message: origMessage, ...data } = error ?? {};
    super(
      {
        status: Status.Error,
        statusCode: HttpStatus.CONFLICT,
        code: 'server-error.10000',
        message: message ?? 'Conflict exists',
        error: data,
      },
      HttpStatus.CONFLICT,
      options,
    );
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
