import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { EditorLayerResponse } from './editor-layer.response';

export class EditorLayerGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Слой редактора',
    type: EditorLayerResponse,
    required: true,
  })
  data!: EditorLayerResponse;
}
