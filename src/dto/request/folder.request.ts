import { PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { FolderEntity } from '@/database/folder.entity';

export class FolderRequest extends PickType(FolderEntity, [
  'id',
  'name',
  'parentFolderId',
]) {
  @IsOptional()
  name!: string;
}
