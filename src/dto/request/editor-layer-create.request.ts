import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

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
  @IsDefined()
  @IsNotEmpty()
  @IsUUID()
  file!: string;
}
