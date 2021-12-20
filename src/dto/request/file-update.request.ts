import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsJSON, IsNotEmpty, IsUUID } from 'class-validator';

import { FileEntity } from '@/database/file.entity';

export class FileUpdateRequest extends PartialType(
  PickType(FileEntity, ['name', 'folderId']),
) {}
