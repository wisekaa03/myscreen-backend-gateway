import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { MonitorPartialRequest } from './monitor-partial.request';

export class MonitorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'MonitorRequest',
    type: MonitorPartialRequest,
    required: false,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MonitorPartialRequest)
  where?: Partial<MonitorPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    title: 'LimitRequest',
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<MonitorPartialRequest>;
}
