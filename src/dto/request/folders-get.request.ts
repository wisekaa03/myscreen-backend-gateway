import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { FolderPartialRequest } from './folder-partial.request';

export class FoldersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: FolderPartialRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => FolderPartialRequest)
  where?: Partial<FolderPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<FolderPartialRequest>;
}
