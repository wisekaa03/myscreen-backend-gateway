import { ApiProperty, OmitType } from '@nestjs/swagger';
// import { Point } from 'geojson';

import { MonitorEntity } from '@/database/monitor.entity';
import { FileEntity } from '@/database/file.entity';
import { PlaylistEntity } from '@/database/playlist.entity';
import { PlaylistResponse } from './playlist.response';
import { FileResponse } from './file.response';

export class MonitorResponse extends OmitType(MonitorEntity, [
  'playlist',
  'photos',
  'documents',
  'favorities',
  'code',
]) {
  @ApiProperty({
    description: 'Плэйлист привязанный к монитору',
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

  @ApiProperty({
    type: 'string',
    description: 'Идентификатор устройства',
    example: '111-111-111',
    required: true,
  })
  code!: string | null;
}
