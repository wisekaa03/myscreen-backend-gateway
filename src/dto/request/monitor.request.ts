import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsInt } from 'class-validator';

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
    type: 'array',
    description: 'Стоимость показа 1 секунды в рублях',
    oneOf: [{ type: 'integer' }, { type: 'array', items: { type: 'integer' } }],
    examples: {
      one: 1,
      range: [1, 2],
    },
    required: false,
  })
  @IsInt({ each: true })
  price1s!: MSRange<number>;

  @ApiProperty({
    type: 'array',
    description: 'Гарантированное минимальное количество показов в день',
    oneOf: [{ type: 'integer' }, { type: 'array', items: { type: 'integer' } }],
    examples: {
      one: 1,
      range: [1, 2],
    },
    required: false,
  })
  @IsInt({ each: true })
  minWarranty!: MSRange<number>;

  @ApiProperty({
    type: 'array',
    description: 'Максимальная длительность плэйлиста в секундах',
    oneOf: [{ type: 'integer' }, { type: 'array', items: { type: 'integer' } }],
    examples: {
      one: 1,
      range: [1, 2],
    },
    required: false,
  })
  @IsInt({ each: true })
  maxDuration!: MSRange<number>;

  @ApiProperty({
    description: 'Время начала проигрывания',
    type: 'array',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  dateWhenApp?: MSRange<Date>;

  @ApiProperty({
    description: 'Время создания',
    type: 'array',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: MSRange<Date>;

  @ApiProperty({
    description: 'Время изменения',
    type: 'array',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: MSRange<Date>;
}
