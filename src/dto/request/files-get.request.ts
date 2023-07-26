import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { FileEntity } from '@/database/file.entity';
import { LimitRequest } from './limit.request';
import { FilePartialRequest } from './file-partial.request';

export class FilesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: FilePartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FilePartialRequest)
  where?: FindOptionsWhere<FilePartialRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(FileEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<FilePartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<FilePartialRequest>;
}
