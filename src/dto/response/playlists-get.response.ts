import { ApiProperty } from '@nestjs/swagger';

import { Status } from '@/enums/status.enum';
import { PlaylistResponse } from './playlist.response';

export class PlaylistsGetResponse {
  @ApiProperty({
    description: 'Статус операции',
    enum: Status,
    example: Status.Success,
    required: true,
  })
  status!: Status.Success;

  @ApiProperty({ description: 'Количество плэйлистов' })
  count!: number;

  @ApiProperty({
    description: 'Плэйлисты',
    type: PlaylistResponse,
    isArray: true,
    required: true,
  })
  data!: PlaylistResponse[];
}
