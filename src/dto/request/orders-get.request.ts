import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { OrderEntity } from '@/database/order.entity';
import { LimitRequest } from './limit.request';
import { OrderRequest } from './order.request';

export class OrdersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: OrderRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OrderRequest)
  where!: OrderRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope!: LimitRequest<OrderEntity>;
}
