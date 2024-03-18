import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { InvoiceEntity } from '@/database/invoice.entity';
import { MSRange, MSRangeEnum } from '@/interfaces';
import { InvoiceStatus } from '@/enums';

export class InvoiceRequest extends PartialType(
  OmitType(InvoiceEntity, ['sum', 'status', 'createdAt', 'updatedAt']),
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
  @IsOptional()
  @IsNumber(undefined, {
    each: true,
    message: i18nValidationMessage('validation.IS_NUMBER'),
  })
  @Min(100, { each: true, message: i18nValidationMessage('validation.MIN') })
  sum?: MSRange<number>;

  @ApiProperty({
    type: 'enum',
    enum: InvoiceStatus,
    enumName: 'InvoiceStatus',
    description: 'Подтверждение/отклонение счёта',
    example: {
      range: [InvoiceStatus.AWAITING_CONFIRMATION, InvoiceStatus.CANCELLED],
    },
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(InvoiceStatus, {
    each: true,
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status!: MSRangeEnum<InvoiceStatus>;

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
