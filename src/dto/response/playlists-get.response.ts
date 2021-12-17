import { ApiProperty } from '@nestjs/swagger';

import { Status } from '../status.enum';
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
    title: 'PlaylistResponse',
    type: PlaylistResponse,
    isArray: true,
    required: true,
  })
  data!: PlaylistResponse[];
}
