import { ApiProperty, OmitType } from '@nestjs/swagger';
import { EditorEntity } from '@/database/editor.entity';
import { EditorLayerResponse } from './editor-layer.response';
import { EditorLayerEntity } from '@/database/editor-layers.entity';

export class EditorResponse extends OmitType(EditorEntity, [
  'videoLayers',
  'audioLayers',
]) {
  @ApiProperty({
    description: 'Видео слой',
    type: () => EditorLayerResponse,
    isArray: true,
    required: true,
  })
  videoLayers?: EditorLayerEntity[];

  @ApiProperty({
    description: 'Аудио слой',
    type: () => EditorLayerResponse,
    isArray: true,
    required: true,
  })
  audioLayers?: EditorLayerEntity[];
}
