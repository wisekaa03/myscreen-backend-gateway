import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { FileEntity } from '@/database/file.entity';
import { LimitRequest } from './limit.request';
import { FileRequest } from './file.request';

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
    required: false,
  })
  @IsOptional()
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
