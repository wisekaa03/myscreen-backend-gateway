import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { MonitorPlaylistResponse } from './monitor-playlist.response';

export class MonitorUpdateResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Монитор',
    type: MonitorPlaylistResponse,
    required: true,
  })
  data!: MonitorPlaylistResponse;
}
