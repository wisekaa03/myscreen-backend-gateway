import { ApiProperty } from '@nestjs/swagger';

import { Status } from '../../enums/status.enum';
import { InvoiceResponse } from './invoice.response';

export class InvoiceGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Счёт',
    type: InvoiceResponse,
    required: true,
  })
  data!: InvoiceResponse;
}
