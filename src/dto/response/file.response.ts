import { ApiProperty, OmitType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';
import { MonitorResponse, PlaylistResponse } from '@/dto/response';
import { FolderEntity } from '@/database/folder.entity';
import { FolderResponse } from './folder.response';

export class FileResponse extends OmitType(FileEntity, [
  'monitors',
  'playlists',
  'preview',
  'folder',
  'folderId',
]) {
  @ApiProperty({
    description: 'Папка',
    type: FolderResponse,
    required: true,
  })
  folder?: FolderEntity;

  @ApiProperty({
    description: 'Мониторы',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/MonitorResponse' }],
    required: false,
    isArray: true,
  })
  monitors?: MonitorResponse[];

  @ApiProperty({
    description: 'Плэйлисты',
    type: 'string',
    allOf: [{ $ref: '#/components/schemas/PlaylistResponse' }],
    required: false,
    isArray: true,
  })
  playlists?: PlaylistResponse[];
}
