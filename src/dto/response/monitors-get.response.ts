import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { MonitorPlaylistResponse } from './monitor-playlist.response';

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
    type: MonitorPlaylistResponse,
    isArray: true,
    required: true,
  })
  data!: MonitorPlaylistResponse[];
}
