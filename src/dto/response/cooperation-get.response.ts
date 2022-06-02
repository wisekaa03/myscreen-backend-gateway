import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { CooperationResponse } from './cooperation.response';

export class CooperationGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Взаимодействие покупателей и продавца',
    type: CooperationResponse,
    required: true,
  })
  data!: CooperationResponse;
}
