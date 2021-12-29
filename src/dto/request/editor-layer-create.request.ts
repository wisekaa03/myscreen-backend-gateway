import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDefined, IsUUID } from 'class-validator';

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
  })
  @IsDefined()
  @IsUUID()
  file!: string;
}
