import { PartialType, PickType } from '@nestjs/swagger';

import { EditorLayerEntity } from '@/database/editor-layer.entity';

export class EditorLayerUpdateRequest extends PartialType(
  PickType(EditorLayerEntity, [
    'cutTo',
    'cutFrom',
    'duration',
    'start',
    'mixVolume',
    'index',
  ]),
) {}
