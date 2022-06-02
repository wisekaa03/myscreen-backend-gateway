import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { CooperationResponse } from './cooperation.response';

export class CooperationsGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество взаимодействий' })
  count!: number;

  @ApiProperty({
    description: 'Взаимодействия покупателей и продавца',
    type: CooperationResponse,
    isArray: true,
    required: true,
  })
  data!: CooperationResponse[];
}
