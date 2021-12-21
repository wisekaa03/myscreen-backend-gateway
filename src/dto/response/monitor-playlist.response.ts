// import { OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';
import { PlaylistResponse } from './playlist.response';

export class MonitorPlaylistResponse extends MonitorEntity {
  @ApiProperty({
    description: 'Плэйлист',
    type: () => PlaylistResponse,
  })
  playlist?: PlaylistResponse | null;
}
