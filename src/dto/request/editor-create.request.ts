import { PickType } from '@nestjs/swagger';

import { EditorEntity } from '@/database/editor.entity';

export class EditorCreateRequest extends PickType(EditorEntity, [
  'name',
  'fps',
  'width',
  'height',
  'keepSourceAudio',
]) {}
