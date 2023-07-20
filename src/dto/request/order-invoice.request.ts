import { PickType } from '@nestjs/swagger';
import { OrderEntity } from '@/database/order.entity';

export class OrderInvoiceRequest extends PickType(OrderEntity, ['sum']) {}
