import { PartialType, PickType } from '@nestjs/swagger';

import { EditorEntity } from '@/database/editor.entity';

export class EditorUpdateRequest extends PartialType(
  PickType(EditorEntity, ['name', 'fps', 'width', 'height', 'keepSourceAudio']),
) {}
