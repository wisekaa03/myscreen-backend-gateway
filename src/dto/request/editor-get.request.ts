import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { EditorEntity } from '@/database/editor.entity';
import { LimitRequest } from './limit.request';
import { EditorRequest } from './editor.request';

export class EditorGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: EditorRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EditorRequest)
  where?: FindOptionsWhere<EditorRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(EditorEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsArray()
  select?: FindOptionsSelect<EditorRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<EditorRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<EditorRequest>)
  scope?: LimitRequest<EditorRequest>;
}
