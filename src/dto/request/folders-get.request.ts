import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { FolderEntity } from '@/database/folder.entity';
import { LimitRequest } from './limit.request';
import { FolderPartialRequest } from './folder-partial.request';

export class FoldersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: FolderPartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FolderPartialRequest)
  where?: FindOptionsWhere<FolderPartialRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(FolderEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<FolderPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<FolderPartialRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<FolderPartialRequest>)
  scope?: LimitRequest<FolderPartialRequest>;
}
