import { ApiProperty, OmitType } from '@nestjs/swagger';

import { MonitorResponse } from '@/dto/response/monitor.response';
import { PlaylistEntity } from '@/database/playlist.entity';
import { FileResponse } from './file.response';
import { FileEntity } from '@/database/file.entity';

export class PlaylistResponse extends OmitType(PlaylistEntity, [
  'monitors',
  'files',
]) {
  @ApiProperty({
    description: 'Мониторы',
    type: 'array',
    items: { $ref: '#/components/schemas/MonitorResponse' },
  })
  monitors?: MonitorResponse[] | null;

  @ApiProperty({
    description: 'Файлы',
    type: () => FileResponse,
    items: { $ref: '#/components/schemas/FileResponse' },
    isArray: true,
  })
  files?: FileEntity[];
}
