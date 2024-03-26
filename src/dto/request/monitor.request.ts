import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional } from 'class-validator';

import { i18nValidationMessage } from 'nestjs-i18n';
import { MonitorEntity } from '@/database/monitor.entity';
import { MSRange } from '@/interfaces';

export class MonitorRequest extends PartialType(
  OmitType(MonitorEntity, [
    'lastSeen',
    'user',
    'userId',
    'playlist',
    'monitorInfo',
    'groupIds',
    'files',
    'price1s',
    'minWarranty',
    'maxDuration',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    description: 'Стоимость показа 1 секунды в рублях',
    oneOf: [{ type: 'integer' }, { type: 'array', items: { type: 'integer' } }],
    examples: {
      one: 1,
      range: [1, 2],
    },
    required: false,
  })
  @IsOptional()
  @IsInt({ each: true, message: i18nValidationMessage('validation.IS_INT') })
  price1s!: MSRange<number>;

  @ApiProperty({
    description: 'Гарантированное минимальное количество показов в день',
    oneOf: [{ type: 'integer' }, { type: 'array', items: { type: 'integer' } }],
    examples: {
      one: 1,
      range: [1, 2],
    },
    required: false,
  })
  @IsOptional()
  @IsInt({ each: true, message: i18nValidationMessage('validation.IS_INT') })
  minWarranty!: MSRange<number>;

  @ApiProperty({
    description: 'Максимальная длительность плэйлиста в секундах',
    oneOf: [{ type: 'integer' }, { type: 'array', items: { type: 'integer' } }],
    examples: {
      one: 1,
      range: [1, 2],
    },
    required: false,
  })
  @IsOptional()
  @IsInt({ each: true, message: i18nValidationMessage('validation.IS_INT') })
  maxDuration!: MSRange<number>;

  @ApiProperty({
    description: 'Время начала проигрывания',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    { strict: false },
    { each: true, message: i18nValidationMessage('validation.IS_DATE_RANGE') },
  )
  dateWhenApp?: MSRange<Date>;

  @ApiProperty({
    description: 'Время создания',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    { strict: false },
    { each: true, message: i18nValidationMessage('validation.IS_DATE_RANGE') },
  )
  createdAt?: MSRange<Date>;

  @ApiProperty({
    description: 'Время изменения',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    { strict: false },
    { each: true, message: i18nValidationMessage('validation.IS_DATE_RANGE') },
  )
  updatedAt?: MSRange<Date>;
}
