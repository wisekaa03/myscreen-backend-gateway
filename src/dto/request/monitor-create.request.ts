import { ApiProperty, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

import { MonitorEntity } from '@/database/monitor.entity';

export class MonitorMultipleRequest {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    description: 'Подчиненный монитор в группе мониторов',
    required: true,
  })
  @IsNotEmpty()
  @IsUUID()
  monitorId!: string;

  @ApiProperty({
    type: 'number',
    description: 'Подчиненный номер монитора в группе мониторов',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  multipleNo!: number;
}

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
  'multiple',
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

  @ApiProperty({
    type: MonitorMultipleRequest,
    description: 'Подчиненные мониторы в группе мониторов',
    isArray: true,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MonitorMultipleRequest)
  multipleIds?: MonitorMultipleRequest[];
}
