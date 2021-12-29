import { OmitType, PartialType } from '@nestjs/swagger';

import { EditorLayerEntity } from '@/database/editor-layer.entity';

export class EditorLayerUpdateRequest extends PartialType(
  OmitType(EditorLayerEntity, ['id', 'file', 'createdAt', 'updatedAt']),
) {}
