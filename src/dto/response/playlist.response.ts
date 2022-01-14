import { ApiProperty, OmitType } from '@nestjs/swagger';
import { PlaylistEntity } from '@/database/playlist.entity';
import { FileResponse } from './file.response';

export class PlaylistResponse extends OmitType(PlaylistEntity, ['files']) {
  @ApiProperty({
    description: 'Файлы',
    type: () => FileResponse,
    isArray: true,
  })
  files?: FileResponse[];
}
