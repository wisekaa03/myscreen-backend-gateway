import { OmitType } from '@nestjs/swagger';
import { OrderEntity } from '@/database/order.entity';

export class OrderResponse extends OmitType(OrderEntity, []) {
  id!: string;
}
