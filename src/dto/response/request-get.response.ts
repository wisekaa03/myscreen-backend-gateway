import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { RequestResponse } from './request.response';

export class ApplicationGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Взаимодействие покупателей и продавца',
    type: RequestResponse,
    required: true,
  })
  data!: RequestResponse;
}
