import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsJSON, IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { FileCategory } from '@/enums';
import { FileEntity } from '@/database/file.entity';

export class FileUploadRequest extends PickType(FileEntity, [
  'folderId',
  'category',
]) {
  @ApiProperty({
    required: false,
  })
  folderId?: string;

  @ApiProperty({
    required: false,
  })
  category?: FileCategory;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Монитор',
    required: false,
  })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  monitorId?: string;
}

export class FileUploadRequestBody {
  @IsDefined({ message: i18nValidationMessage('validation.NOT_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsJSON({ message: i18nValidationMessage('validation.INVALID_JSON') })
  param!: string;
}
