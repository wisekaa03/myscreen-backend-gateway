import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Length, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { MonitorEntity } from '@/database/monitor.entity';

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
  'groupIds',
]) {
  @ApiProperty({
    type: 'string',
    description: 'Идентификатор устройства',
    example: '111-111-111',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @Length(11, 11, { message: i18nValidationMessage('validation.LENGTH') })
  code!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Ширина',
    example: 1920,
    default: 1920,
    required: false,
  })
  @IsOptional()
  @IsNumber(
    { allowNaN: true, allowInfinity: true, maxDecimalPlaces: 0 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  width!: number;

  @ApiProperty({
    type: 'integer',
    description: 'Высота',
    example: 1080,
    default: 1080,
    required: false,
  })
  @IsOptional()
  @IsNumber(
    { allowNaN: true, allowInfinity: true, maxDecimalPlaces: 0 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  height!: number;
}
