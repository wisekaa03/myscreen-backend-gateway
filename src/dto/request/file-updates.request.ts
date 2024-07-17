import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FileEntity } from '@/database/file.entity';

export class FileUpdatesRequest extends PickType(FileEntity, ['id']) {
  @ApiProperty({
    description: 'Имя файла',
    example: 'foo.mp4',
    required: false,
  })
  @IsOptional({ message: i18nValidationMessage('validation.IS_OPTIONAL') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(1, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  name?: string;

  @ApiProperty({
    description: 'Идентификатор папки',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional({ message: i18nValidationMessage('validation.IS_OPTIONAL') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  folderId?: string;
}
