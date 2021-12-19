import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { MonitorEntity } from '@/database/monitor.entity';
import { LimitRequest } from './limit.request';
import { MonitorRequest } from './monitor.request';

export class MonitorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'MonitorRequest',
    type: MonitorRequest,
    required: false,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MonitorRequest)
  where?: MonitorRequest;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<MonitorEntity>;
}
