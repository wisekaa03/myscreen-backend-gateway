import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { EditorResponse } from './editor.response';

export class EditorGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Оплаты',
    title: 'EditorResponse',
    type: EditorResponse,
    isArray: true,
    required: true,
  })
  data!: EditorResponse;
}
