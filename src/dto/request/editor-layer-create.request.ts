import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { EditorLayerEntity } from '@/database/editor-layer.entity';

export class EditorLayerCreateRequest extends PartialType(
  PickType(EditorLayerEntity, [
    'index',
    'duration',
    'cutTo',
    'cutFrom',
    'start',
    'mixVolume',
    'cropX',
    'cropY',
    'cropW',
    'cropH',
  ]),
) {
  @ApiProperty({
    description: 'Файл',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  file!: string;
}
