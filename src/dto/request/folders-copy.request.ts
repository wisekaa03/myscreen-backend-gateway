import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FolderCopyRequest } from './folder-copy.request';

export class FoldersCopyRequest {
  @ApiProperty({
    description: 'Папка, куда копировать',
    type: String,
    format: 'uuid',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  toFolder!: string;

  @ApiProperty({
    description: 'Папки',
    type: FolderCopyRequest,
    isArray: true,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @ValidateNested()
  @Type(() => FolderCopyRequest)
  folders!: FolderCopyRequest[];
}
