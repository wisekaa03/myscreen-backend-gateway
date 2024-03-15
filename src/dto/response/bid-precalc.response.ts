import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { BidPrecalcDataResponse } from './bid-precalc-data.response';

export class BidPrecalcResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Возвращаемое значение',
    type: BidPrecalcDataResponse,
    required: true,
  })
  data!: BidPrecalcDataResponse;
}
