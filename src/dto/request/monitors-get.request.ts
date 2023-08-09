import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { MonitorEntity } from '@/database/monitor.entity';
import { LimitRequest } from './limit.request';
import { MonitorPartialRequest } from './monitor-partial.request';

export class MonitorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: MonitorPartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitorPartialRequest)
  where?: FindOptionsWhere<MonitorPartialRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(MonitorEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<MonitorPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<MonitorPartialRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<MonitorPartialRequest>)
  scope?: LimitRequest<MonitorPartialRequest>;
}
