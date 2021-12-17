import { OmitType } from '@nestjs/swagger';
import { PaymentEntity } from '@/database/payment.entity';

export class PaymentResponse extends OmitType(PaymentEntity, []) {}
