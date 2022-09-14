import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '../../shared/swagger-get-model-properties';
import { OrderEntity } from '../../database/order.entity';
import { LimitRequest } from './limit.request';
import { OrderRequest } from './order.request';

export class OrdersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: OrderRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderRequest)
  where?: FindOptionsWhere<OrderRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(OrderEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<OrderRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<OrderRequest>;
}
