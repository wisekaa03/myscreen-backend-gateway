import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { LimitRequest } from './limit.request';
import { FileRequest } from './file.request';
import { FileEntity } from '@/database/file.entity';

export class FilesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: FileRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileRequest)
  where?: FindOptionsWhere<FileRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(FileEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsArray()
  select?: FindOptionsSelect<FileRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<FileRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<FileRequest>)
  scope?: LimitRequest<FileRequest>;
}
