import { PickType } from '@nestjs/swagger';

import { FolderExtView } from '@/database/folder-ext.view';

export class FolderResponse extends PickType(FolderExtView, [
  'id',
  'name',
  'parentFolderId',
  'empty',
  'system',
  'createdAt',
  'updatedAt',
  'userId',
]) {}
