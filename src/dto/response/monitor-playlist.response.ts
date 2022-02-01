// import { OmitType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { MonitorEntity } from '@/database/monitor.entity';
import { PlaylistResponse } from './playlist.response';
import { FileResponse } from './file.response';
import { FileEntity } from '@/database/file.entity';
import { PlaylistEntity } from '@/database/playlist.entity';

export class MonitorPlaylistResponse extends MonitorEntity {
  @ApiProperty({
    description: 'Плэйлист',
    type: () => PlaylistResponse,
    required: false,
  })
  playlist?: PlaylistEntity | null;

  @ApiProperty({
    description: 'Фото монитора. Документы на право владения.',
    type: () => FileResponse,
    isArray: true,
    required: false,
  })
  files?: FileEntity[] | null;
}
