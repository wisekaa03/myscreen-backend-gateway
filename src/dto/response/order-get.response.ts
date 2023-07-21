import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { OrderResponse } from './order.response';

export class OrderGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Счет',
    type: OrderResponse,
    required: true,
  })
  data!: OrderResponse;
}
