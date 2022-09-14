import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { EditorEntity } from '../../database/editor.entity';
import { swaggerGetModelProperties } from '../../shared/swagger-get-model-properties';
import { LimitRequest } from './limit.request';
import { EditorPartialRequest } from './editor-partial.request';

export class EditorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: EditorPartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EditorPartialRequest)
  where?: FindOptionsWhere<EditorPartialRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(EditorEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<EditorPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<EditorPartialRequest>;
}
