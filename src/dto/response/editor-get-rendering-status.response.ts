import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { EditorRenderingStatusResponse } from './editor-rendering-status.response';

export class EditorGetRenderingStatusResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Редактор',
    type: EditorRenderingStatusResponse,
    required: true,
  })
  data!: EditorRenderingStatusResponse;
}
