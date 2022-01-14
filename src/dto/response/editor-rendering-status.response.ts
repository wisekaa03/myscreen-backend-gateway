import { PickType } from '@nestjs/swagger';
import { EditorEntity } from '@/database/editor.entity';

export class EditorRenderingStatusResponse extends PickType(EditorEntity, [
  'id',
  'renderingStatus',
  'renderingError',
  'renderedFile',
]) {}
