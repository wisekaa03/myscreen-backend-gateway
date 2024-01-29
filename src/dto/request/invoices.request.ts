import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

import { InvoiceEntity } from '@/database/invoice.entity';
import { MSRange } from '@/interfaces';

export class InvoicesRequest extends PartialType(
  OmitType(InvoiceEntity, ['createdAt', 'updatedAt']),
) {
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
