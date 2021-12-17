import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { OrderEntity } from '@/database/order.entity';
import { LimitRequest } from './limit.request';
import { OrderRequest } from './order.request';

export class OrdersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'OrderRequest',
    type: OrderRequest,
    required: false,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OrderRequest)
  where?: OrderRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<OrderEntity>;
}
