import { ConflictException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@/enums/status.enum';
import { FileIDResponse } from '@/dto/response/file-id.response';

export class ConflictDataFile {
  @ApiProperty({
    description: 'ID ссылки',
    required: false,
  })
  id!: string;

  @ApiProperty({
    description: 'Имя ссылки',
    required: false,
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
    required: false,
  })
  video?: ConflictDataFile[] | null;

  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Редакторы (аудио)',
    required: false,
  })
  audio?: ConflictDataFile[] | null;

  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Плэйлисты',
    required: false,
  })
  playlist?: ConflictDataFile[] | null;

  @ApiProperty({
    type: () => ConflictDataFile,
    description: 'Мониторы',
    required: false,
  })
  monitor?: ConflictDataFile[] | null;
}

/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-ignore
export class ConflictError extends ConflictException {
  constructor(message?: string, data?: Record<string, unknown>) {
    super({
      status: Status.Error,
      statusCode: 409,
      code: 'server-error.10000',
      message: message ?? 'Conflict exists',
      data,
    });
  }

  @ApiProperty({
    enum: Status,
    enumName: 'Status',
    example: Status.Error,
    description: 'Статус операции',
    required: true,
  })
  status!: Status.Error;

  @ApiProperty({ required: true, example: 409 })
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
  data!: ConflictData;
}
