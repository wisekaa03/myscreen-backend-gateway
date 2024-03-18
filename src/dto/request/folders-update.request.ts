import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FolderUpdateRequest } from './folder-update.request';

export class FoldersUpdateRequest {
  @ApiProperty({
    description: 'Папки',
    type: FolderUpdateRequest,
    isArray: true,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @ValidateNested()
  @Type(() => FolderUpdateRequest)
  folders!: FolderUpdateRequest[];
}
