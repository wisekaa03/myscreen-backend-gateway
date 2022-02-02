import { ApiProperty, OmitType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';
import { MonitorResponse, PlaylistResponse } from '@/dto/response';
import { FilePreviewEntity } from '@/database/file-preview.entity';
import { FilePreviewResponse } from './file-preview.response';
import { FolderResponse } from './folder.response';
import { FolderEntity } from '@/database/folder.entity';

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
    description: 'Превью',
    type: FilePreviewResponse,
    required: false,
  })
  preview?: FilePreviewEntity;

  @ApiProperty({
    description: 'Мониторы',
    type: () => MonitorResponse,
    required: false,
    isArray: true,
  })
  monitors?: MonitorResponse[];

  @ApiProperty({
    description: 'Плэйлисты',
    type: () => PlaylistResponse,
    required: false,
    isArray: true,
  })
  playlists?: PlaylistResponse[];
}
