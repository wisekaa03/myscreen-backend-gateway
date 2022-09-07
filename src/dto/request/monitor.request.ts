import { ApiProperty, PickType } from '@nestjs/swagger';
import { Length } from 'class-validator';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorRequest extends PickType(MonitorEntity, [
  'address',
  'category',
  'location',
  'monitorInfo',
  'name',
  'orientation',
  'price1s',
  'status',
]) {
  @ApiProperty({
    type: 'string',
    description: 'Идентификатор устройства',
    example: '111-111-111',
    required: false,
  })
  @Length(11, 11)
  code?: string;
}
