import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorRequest extends PartialType(
  OmitType(MonitorEntity, [
    'lastSeen',
    'user',
    'userId',
    'playlist',
    'monitorInfo',
    'files',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    description: 'Время начала проигрывания',
    examples: { one: ['2021-01-01'], two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  dateWhenApp?: Array<Date>;

  @ApiProperty({
    description: 'Время создания',
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
