import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';

import { EditorEntity } from '@/database/editor.entity';

export class EditorCreateRequest extends IntersectionType(
  PickType(EditorEntity, ['name', 'fps', 'width', 'height', 'keepSourceAudio']),
  PartialType(PickType(EditorEntity, ['cropW', 'cropH', 'cropX', 'cropY'])),
) {}
