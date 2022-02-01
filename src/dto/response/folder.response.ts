import { PickType } from '@nestjs/swagger';
import { FolderEntity } from '@/database/folder.entity';

export class FolderResponse extends PickType(FolderEntity, [
  'id',
  'name',
  'parentFolderId',
  'createdAt',
  'updatedAt',
]) {}
