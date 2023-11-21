import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { RequestEntity } from '@/database/request.entity';
import { LimitRequest } from './limit.request';
import { ApplicationsRequest } from './requests.request';

export class ApplicationsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: ApplicationsRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApplicationsRequest)
  where?: FindOptionsWhere<ApplicationsRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(RequestEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsArray()
  select?: FindOptionsSelect<ApplicationsRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<ApplicationsRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<ApplicationsRequest>)
  scope?: LimitRequest<ApplicationsRequest>;
}
