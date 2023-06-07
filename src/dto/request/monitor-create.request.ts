import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, Length } from 'class-validator';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorCreateRequest extends PickType(MonitorEntity, [
  'address',
  'category',
  'location',
  'monitorInfo',
  'name',
  'orientation',
  'price1s',
  'minWarranty',
  'maxDuration',
  'sound',
]) {
  @ApiProperty({
    type: 'string',
    description: 'Идентификатор устройства',
    example: '111-111-111',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @Length(11, 11)
  code!: string;
}
