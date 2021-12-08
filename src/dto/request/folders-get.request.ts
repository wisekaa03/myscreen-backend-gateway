import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { FolderRequest } from './folder.request';

export class FoldersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'FolderRequest',
    type: FolderRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => FolderRequest)
  where?: FolderRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<FolderRequest>;
}
