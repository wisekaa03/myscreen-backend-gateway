import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { MonitorPlaylistResponse } from './monitor-playlist.response';

export class MonitorGetResponse {
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
    type: MonitorPlaylistResponse,
    required: true,
  })
  data!: MonitorPlaylistResponse;
}
