import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { MonitorResponse } from './monitor.response';

export class MonitorCreateResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Монитор',
    title: 'MonitorResponse',
    type: MonitorResponse,
    required: true,
  })
  data!: MonitorResponse;
}
