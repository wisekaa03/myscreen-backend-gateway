import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { FilePartialRequest } from './file-partial.request';

export class FilesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'FileRequest',
    type: FilePartialRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => FilePartialRequest)
  where?: Partial<FilePartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<FilePartialRequest>;
}
