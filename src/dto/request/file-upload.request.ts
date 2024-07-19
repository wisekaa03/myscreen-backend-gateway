import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsJSON, IsNotEmpty } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FileEntity } from '@/database/file.entity';

export class FileUploadRequest extends PickType(FileEntity, ['folderId']) {
  @ApiProperty({
    required: false,
  })
  folderId?: string;
}

export class FileUploadRequestBody {
  @IsDefined({ message: i18nValidationMessage('validation.NOT_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsJSON({ message: i18nValidationMessage('validation.INVALID_JSON') })
  param!: string;
}
