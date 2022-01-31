import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { EditorLayerEntity } from '@/database/editor-layer.entity';

export class EditorLayerCreateRequest extends OmitType(EditorLayerEntity, [
  'id',
  'file',
  'createdAt',
  'updatedAt',
]) {
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
