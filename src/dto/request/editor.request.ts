import { PartialType, PickType } from '@nestjs/swagger';

import { EditorEntity } from '@/database/editor.entity';

export class EditorRequest extends PartialType(
  PickType(EditorEntity, ['renderingStatus']),
) {}
