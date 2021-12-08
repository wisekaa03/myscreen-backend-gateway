import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { FolderEntity } from '@/database/folder.entity';

export class FolderRequest extends PickType(FolderEntity, [
  'id',
  'name',
  'parentFolderId',
]) {
  @ApiProperty({ required: false })
  @IsOptional()
  id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  name!: string;
}
