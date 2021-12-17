import { PartialType, PickType } from '@nestjs/swagger';

import { PaymentEntity } from '@/database/payment.entity';

export class PaymentRequest extends PartialType(
  PickType(PaymentEntity, ['description']),
) {
  description?: string;
}
