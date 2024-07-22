import { PickType } from '@nestjs/swagger';

import { FolderFileNumberEntity } from '@/database/folder.view.entity';

export class FolderResponse extends PickType(FolderFileNumberEntity, [
  'id',
  'name',
  'parentFolderId',
  'empty',
  'system',
  'createdAt',
  'updatedAt',
]) {}
