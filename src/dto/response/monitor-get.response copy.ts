import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { MonitorResponse } from './monitor.response';

export class MonitorGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Монитор',
    type: MonitorResponse,
    required: true,
  })
  data!: MonitorResponse;
}
