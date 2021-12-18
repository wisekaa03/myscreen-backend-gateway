import { PickType } from '@nestjs/swagger';

import { FileEntity } from '@/database/file.entity';

export class FileRequest extends PickType(FileEntity, [
  'folderId',
  'category',
  'videoType',
]) {}
