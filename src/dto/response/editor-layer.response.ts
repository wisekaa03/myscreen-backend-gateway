import { ApiProperty, OmitType } from '@nestjs/swagger';
import { EditorLayerEntity } from '@/database/editor-layer.entity';
import { FileResponse } from './file.response';

export class EditorLayerResponse extends OmitType(EditorLayerEntity, ['file']) {
  @ApiProperty({
    description: 'Файл',
    type: () => FileResponse,
    required: true,
  })
  file!: FileResponse;
}
