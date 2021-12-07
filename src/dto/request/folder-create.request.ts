import { PickType } from '@nestjs/swagger';

import { FolderEntity } from '@/database/folder.entity';

export class FolderCreateRequest extends PickType(FolderEntity, [
  'name',
  'parentFolderId',
]) {}
