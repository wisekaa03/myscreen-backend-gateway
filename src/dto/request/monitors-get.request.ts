import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { MonitorEntity } from '@/database/monitor.entity';
import { LimitRequest } from './limit.request';
import { MonitorRequest } from './monitor.request';

export class MonitorsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    title: 'MonitorRequest',
    type: PartialType(
      OmitType(MonitorRequest, ['address', 'price', 'monitorInfo']),
    ),
    required: false,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() =>
    PartialType(OmitType(MonitorRequest, ['address', 'price', 'monitorInfo'])),
  )
  where?: Omit<MonitorRequest, 'address' | 'price' | 'monitorInfo'>;

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
