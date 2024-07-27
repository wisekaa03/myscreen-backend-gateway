import { ApiProperty, OmitType } from '@nestjs/swagger';

import { FolderEntity } from '@/database/folder.entity';
import { FolderResponse } from './folder.response';
import { FileExtView } from '@/database/file-ext.view';

export class FileResponse extends OmitType(FileExtView, [
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
}
