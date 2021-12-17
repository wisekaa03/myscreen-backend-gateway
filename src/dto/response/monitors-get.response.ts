import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { MonitorResponse } from './monitor.response';

export class MonitorsGetResponse {
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
    title: 'MonitorResponse',
    type: MonitorResponse,
    isArray: true,
    required: true,
  })
  data!: MonitorResponse[];
}
