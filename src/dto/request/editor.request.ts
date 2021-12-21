import { OmitType } from '@nestjs/swagger';
import { EditorEntity } from '@/database/editor.entity';

export class EditorRequest extends OmitType(EditorEntity, [
  'videoLayers',
  'audioLayers',
]) {}
