import { PickType } from '@nestjs/swagger';
import { FolderEntity } from '@/database/folder.entity';

export class FolderRequest extends PickType(FolderEntity, [
  'id',
  'name',
  'parentFolderId',
]) {}
