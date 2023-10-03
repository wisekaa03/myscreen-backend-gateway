import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { MonitorEntity } from '@/database/monitor.entity';
import { LimitRequest } from './limit.request';
import { MonitorRequest } from './monitor.request';

export class MonitorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: MonitorRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitorRequest)
  where?: FindOptionsWhere<MonitorRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(MonitorEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<MonitorRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<MonitorRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<MonitorRequest>)
  scope?: LimitRequest<MonitorRequest>;
}
