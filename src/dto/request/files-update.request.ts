import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { i18nValidationMessage } from 'nestjs-i18n';
import { FileUpdatesRequest } from './file-updates.request';

export class FilesUpdateRequest {
  @ApiProperty({
    description: 'Файлы',
    type: FileUpdatesRequest,
    isArray: true,
    required: true,
  })
  @IsDefined({
    each: true,
    message: i18nValidationMessage('validation.IS_DEFINED'),
  })
  @IsNotEmpty({
    each: true,
    message: i18nValidationMessage('validation.IS_NOT_EMPTY'),
  })
  @ValidateNested()
  @Type(() => FileUpdatesRequest)
  files!: FileUpdatesRequest[];
}
