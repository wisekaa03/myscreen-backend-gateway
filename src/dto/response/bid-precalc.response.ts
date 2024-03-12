import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { RequestPrecalcDataResponse } from './bid-precalc-data.response';

export class RequestPrecalcResponse {
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
    type: RequestPrecalcDataResponse,
    required: true,
  })
  data!: RequestPrecalcDataResponse;
}
