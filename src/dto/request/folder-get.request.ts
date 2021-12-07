import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

import { FolderEntity } from '@/database/folder.entity';
import { Folder } from '../folder.dto';
import { LimitRequest } from './limit.request';

export class FoldersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'Folder',
    type: Folder,
    required: false,
  })
  @IsObject()
  @IsOptional()
  where?: Pick<FolderEntity, 'name' | 'parentFolder'>;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest<Folder>',
    type: LimitRequest,
    required: false,
  })
  @IsObject()
  @IsOptional()
  scope?: LimitRequest<FolderEntity>;
}
