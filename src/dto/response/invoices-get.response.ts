import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { InvoiceResponse } from './invoice.response';

export class InvoicesGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество заказов' })
  count!: number;

  @ApiProperty({
    description: 'Заказы',
    type: InvoiceResponse,
    isArray: true,
    required: true,
  })
  data!: InvoiceResponse[];
}
