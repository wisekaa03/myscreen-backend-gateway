import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsJSON, IsNotEmpty, IsUUID } from 'class-validator';

import { FileEntity } from '@/database/file.entity';

export class FileUpdateRequest extends PickType(FileEntity, [
  'name',
  'folderId',
]) {}
