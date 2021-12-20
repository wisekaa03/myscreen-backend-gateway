import { PartialType, PickType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';

export class FilePartialRequest extends PartialType(
  PickType(FileEntity, ['folderId', 'category', 'videoType']),
) {}
