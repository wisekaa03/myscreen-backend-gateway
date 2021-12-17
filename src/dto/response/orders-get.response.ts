import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/dto/status.enum';
import { OrderResponse } from './order.response';

export class OrdersGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество заказов' })
  count!: number;

  @ApiProperty({
    description: 'Заказы',
    title: 'OrderResponse',
    type: OrderResponse,
    isArray: true,
    required: true,
  })
  data!: OrderResponse[];
}
