import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { RequestResponse } from './request.response';

export class ApplicationsGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество взаимодействий' })
  count!: number;

  @ApiProperty({
    description: 'Взаимодействия покупателей и продавца',
    type: RequestResponse,
    isArray: true,
    required: true,
  })
  data!: RequestResponse[];
}
