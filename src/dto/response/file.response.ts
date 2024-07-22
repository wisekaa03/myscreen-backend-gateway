import { ApiProperty, OmitType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';
import { FolderEntity } from '@/database/folder.entity';
import { FolderResponse } from './folder.response';

export class FileResponse extends OmitType(FileEntity, [
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
