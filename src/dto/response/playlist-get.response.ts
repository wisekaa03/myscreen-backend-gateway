import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { PlaylistResponse } from './playlist.response';

export class PlaylistGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    enumName: 'Status',
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({
    description: 'Плэйлист',
    type: PlaylistResponse,
    required: true,
  })
  data!: PlaylistResponse;
}
