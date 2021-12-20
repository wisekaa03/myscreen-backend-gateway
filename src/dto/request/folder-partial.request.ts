import { PartialType, PickType } from '@nestjs/swagger';
import { FolderEntity } from '@/database/folder.entity';

export class FolderPartialRequest extends PartialType(
  PickType(FolderEntity, ['id', 'name', 'parentFolderId']),
) {}
