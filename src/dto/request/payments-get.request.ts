import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { PaymentEntity } from '@/database/payment.entity';
import { PaymentRequest } from './payment.request';

export class PaymentsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'PaymentRequest',
    type: PaymentRequest,
    required: false,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PaymentRequest)
  where?: PaymentRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<PaymentEntity>;
}
