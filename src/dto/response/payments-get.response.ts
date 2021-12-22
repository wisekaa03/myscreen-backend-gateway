import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { PaymentResponse } from './payment.response';

export class PaymentsGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество оплат' })
  count!: number;

  @ApiProperty({
    description: 'Оплаты',
    type: PaymentResponse,
    isArray: true,
    required: true,
  })
  data!: PaymentResponse[];
}
