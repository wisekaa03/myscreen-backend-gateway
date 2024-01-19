import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

import { MonitorEntity } from '@/database/monitor.entity';
import { MonitorGroup } from './monitor-group';

export class MonitorCreateRequest extends PickType(MonitorEntity, [
  'address',
  'category',
  'location',
  'angle',
  'brightness',
  'model',
  'matrix',
  'width',
  'height',
  'name',
  'orientation',
  'price1s',
  'minWarranty',
  'maxDuration',
  'sound',
  'multiple',
]) {
  @ApiProperty({
    type: 'string',
    description: 'Идентификатор устройства',
    example: '111-111-111',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @Length(11, 11)
  code!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Ширина',
    example: 1920,
    default: 1920,
    required: false,
  })
  @IsNumber()
  @Min(1)
  width!: number;

  @ApiProperty({
    type: 'integer',
    description: 'Высота',
    example: 1080,
    default: 1080,
    required: false,
  })
  @IsNumber()
  @Min(1)
  height!: number;

  @ApiProperty({
    type: MonitorGroup,
    description: 'Подчиненные мониторы в группе мониторов',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitorGroup)
  groupIds?: MonitorGroup[];
}
