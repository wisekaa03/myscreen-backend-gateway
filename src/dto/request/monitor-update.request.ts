import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorMultipleRequest } from './monitor-create.request';

export class MonitorUpdateRequest extends PartialType(
  OmitType(MonitorEntity, [
    'lastSeen',
    'user',
    'userId',
    'playlist',
    'files',
    'monitorInfo',
    'favorite',
    'favorities',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    type: MonitorMultipleRequest,
    description: 'Подчиненные мониторы в группе мониторов',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitorMultipleRequest)
  groupIds!: MonitorMultipleRequest[];

  @ApiProperty({
    type: MonitorMultipleRequest,
    description: 'Подчиненные мониторы в группе мониторов',
    isArray: true,
    deprecated: true,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitorMultipleRequest)
  multipleIds!: MonitorMultipleRequest[];
}
