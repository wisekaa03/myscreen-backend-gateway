import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';

import { InvoiceEntity } from '@/database/invoice.entity';
import { MSRange } from '@/interfaces';

export class InvoicesRequest extends PartialType(
  OmitType(InvoiceEntity, ['sum', 'createdAt', 'updatedAt']),
) {
  @ApiProperty({
    description: 'Сумма счета',
    oneOf: [{ type: 'number' }, { type: 'array', items: { type: 'number' } }],
    examples: {
      one: 1000,
      range: [1000, 2000],
    },
    required: false,
  })
  @IsNumber(undefined, { each: true })
  @Min(100, { each: true })
  sum?: MSRange<number>;

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
  @IsDateString({ strict: false }, { each: true })
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
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: MSRange<Date>;
}
