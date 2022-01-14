// import { OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';
import { PlaylistResponse } from './playlist.response';
import { FileResponse } from './file.response';

export class MonitorPlaylistResponse extends MonitorEntity {
  @ApiProperty({
    description: 'Плэйлист',
    type: () => PlaylistResponse,
    required: false,
  })
  playlist?: PlaylistResponse | null;

  @ApiProperty({
    description: 'Фото монитора. Документы на право владения.',
    type: () => FileResponse,
    isArray: true,
    required: false,
  })
  files?: FileResponse[] | null;
}
