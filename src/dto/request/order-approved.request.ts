import { PickType } from '@nestjs/swagger';
import { OrderEntity } from '@/database/order.entity';

export class OrderApprovedRequest extends PickType(OrderEntity, [
  'id',
  'approved',
]) {}
