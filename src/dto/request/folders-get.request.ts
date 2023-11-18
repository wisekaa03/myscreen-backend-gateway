import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { FolderEntity } from '@/database/folder.entity';
import { LimitRequest } from './limit.request';
import { FolderRequest } from './folder.request';

export class FoldersGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: FolderRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FolderRequest)
  where?: FindOptionsWhere<FolderRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(FolderEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsArray()
  select?: FindOptionsSelect<FolderRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<FolderRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<FolderRequest>)
  scope?: LimitRequest<FolderRequest>;
}
