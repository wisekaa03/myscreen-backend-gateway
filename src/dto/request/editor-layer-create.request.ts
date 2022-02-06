import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { EditorLayerEntity } from '@/database/editor-layer.entity';

export class EditorLayerCreateRequest extends PartialType(
  PickType(EditorLayerEntity, [
    'index',
    'duration',
    'cutTo',
    'cutFrom',
    'start',
    'mixVolume',
  ]),
) {
  @ApiProperty({
    description: 'Файл',
    type: 'string',
    format: 'uuid',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  file!: string;
}
