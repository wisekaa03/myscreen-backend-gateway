import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { FileEntity } from '@/database/file.entity';
import { LimitRequest } from './limit.request';
import { FileRequest } from './file.request';

export class FilesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'FileRequest',
    type: FileRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => FileRequest)
  where?: FileRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<FileEntity>;
}
