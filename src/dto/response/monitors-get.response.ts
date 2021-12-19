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

  @ApiProperty({ description: 'Количество мониторов' })
  count!: number;

  @ApiProperty({
    description: 'Мониторы',
    title: 'MonitorResponse',
    type: MonitorResponse,
    isArray: true,
    required: true,
  })
  data!: MonitorResponse[];
}
