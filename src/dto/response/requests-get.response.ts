import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { ApplicationResponse } from './request.response';

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
    type: ApplicationResponse,
    isArray: true,
    required: true,
  })
  data!: ApplicationResponse[];
}
