import { PartialType, PickType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';

export class FileUpdateRequest extends PartialType(
  PickType(FileEntity, ['name', 'folderId']),
) {}
