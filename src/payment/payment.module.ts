import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrderEntity } from './order.entity';
import { PaymentEntity } from './payment.entity';
import { PaymentLogsEntity } from './payment-logs.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, PaymentEntity, PaymentLogsEntity]),
  ],
  providers: [Logger],
})
export class PaymentModule {}
