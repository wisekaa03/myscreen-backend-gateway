// import { OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';
import { PlaylistResponse } from './playlist.response';

export class MonitorResponse extends MonitorEntity {
  @ApiProperty({
    type: () => PlaylistResponse,
  })
  playlist?: PlaylistResponse | null;
}
