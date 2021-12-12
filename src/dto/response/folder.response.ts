import { PickType } from '@nestjs/swagger';
import { FolderEntity } from '@/database/folder.entity';

export class FolderResponse extends PickType(FolderEntity, [
  'id',
  'name',
  'userId',
  'parentFolderId',
  'createdAt',
  'updatedAt',
]) {
  id!: string;

  name!: string;

  userId!: string;

  parentFolderId!: string | null;
}
