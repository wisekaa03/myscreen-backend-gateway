import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { BidResponse } from './bid.response';

export class BidGetResponse {
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
    type: BidResponse,
    required: true,
  })
  data!: BidResponse;
}
