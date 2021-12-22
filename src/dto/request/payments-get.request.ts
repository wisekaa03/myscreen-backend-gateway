import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { PaymentEntity } from '@/database/payment.entity';
import { LimitRequest } from './limit.request';
import { PaymentRequest } from './payment.request';

export class PaymentsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: PaymentRequest,
    required: false,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => PaymentRequest)
  where?: PaymentRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<PaymentEntity>;
}
