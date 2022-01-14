import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

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
    isArray: false,
    required: true,
  })
  @IsNotEmpty()
  @IsDefined()
  @IsUUID()
  file!: string;
}
