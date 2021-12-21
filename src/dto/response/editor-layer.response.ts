import { ApiProperty, OmitType } from '@nestjs/swagger';
import { EditorLayerEntity } from '@/database/editor-layers.entity';
import { FileResponse } from './file.response';

export class EditorLayerResponse extends OmitType(EditorLayerEntity, ['file']) {
  @ApiProperty({
    description: 'Файл',
    type: () => FileResponse,
    isArray: true,
    required: true,
  })
  file?: FileResponse[];
}
