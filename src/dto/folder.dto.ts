import { PickType } from '@nestjs/swagger';
import { FolderEntity } from '../database/folder.entity';

export class Folder extends PickType(FolderEntity, [
  'id',
  'name',
  'parentFolderId',
  'createdAt',
  'updatedAt',
]) {}
