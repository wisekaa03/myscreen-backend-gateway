import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { BidResponse } from './bid.response';

export class BidsGetResponse {
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
    type: BidResponse,
    isArray: true,
    required: true,
  })
  data!: BidResponse[];
}
