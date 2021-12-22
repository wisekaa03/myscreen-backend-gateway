import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitRequest } from './limit.request';
import { MonitorPartialRequest } from './monitor-partial.request';

export class MonitorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
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
    type: LimitRequest,
    required: false,
  })
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<MonitorPartialRequest>;
}
