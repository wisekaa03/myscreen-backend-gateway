import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { EditorResponse } from './editor.response';

export class EditorsGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество оплат' })
  count!: number;

  @ApiProperty({
    description: 'Оплаты',
    type: EditorResponse,
    isArray: true,
    required: true,
  })
  data!: EditorResponse[];
}
