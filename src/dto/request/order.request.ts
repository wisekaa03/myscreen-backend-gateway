import { PartialType, PickType } from '@nestjs/swagger';

import { OrderEntity } from '@/database/order.entity';

export class OrderRequest extends PartialType(
  PickType(OrderEntity, ['description']),
) {
  description?: string;
}
