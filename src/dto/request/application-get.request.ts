import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { ApplicationEntity } from '@/database/application.entity';
import { LimitRequest } from './limit.request';
import { ApplicationPartialRequest } from './application-partial.request';

export class ApplicationGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: ApplicationPartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationPartialRequest)
  where?: FindOptionsWhere<ApplicationPartialRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(ApplicationEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<ApplicationPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<ApplicationPartialRequest>;
}
