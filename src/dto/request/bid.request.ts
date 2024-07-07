import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, ValidateIf } from 'class-validator';

import { i18nValidationMessage } from 'nestjs-i18n';
import { BidApprove, BidStatus } from '@/enums';
import { BidEntity } from '@/database/bid.entity';
import { MSRange, MSRangeEnum } from '@/interfaces';

export class BidRequest extends PartialType(
  OmitType(BidEntity, [
    'buyer',
    'seller',
    'monitor',
    'playlist',
    'hide',
    'parentRequest',
    'parentRequestId',
    'status',
    'approved',
    'user',
    'dateWhen',
    'dateBefore',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    type: 'enum',
    description: 'Не обработан / Разрешен / Запрещен',
    enum: BidApprove,
    enumName: 'BidApprove',
    example: {
      range: [BidApprove.NOTPROCESSED, BidApprove.ALLOWED],
    },
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(BidApprove, {
    each: true,
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  approved?: MSRangeEnum<BidApprove>;

  @ApiProperty({
    type: 'enum',
    description: 'Ок / Подождите',
    enum: BidStatus,
    enumName: 'BidStatus',
    example: {
      range: [BidStatus.OK, BidStatus.WAITING],
    },
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(BidStatus, {
    each: true,
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: MSRangeEnum<BidStatus>;

  @ApiProperty({
    description: 'Время когда',
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
    {
      each: true,
      message: i18nValidationMessage('validation.IS_DATE_RANGE'),
    },
  )
  dateWhen?: MSRange<Date>;

  @ApiProperty({
    description: 'Время до',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { each: true, message: i18nValidationMessage('validation.IS_DATE') },
  )
  @ValidateIf((object, value) => value !== null, { each: true })
  dateBefore?: MSRange<Date | null>;

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
    {
      each: true,
      message: i18nValidationMessage('validation.IS_DATE_RANGE'),
    },
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
    {
      each: true,
      message: i18nValidationMessage('validation.IS_DATE_RANGE'),
    },
  )
  updatedAt?: MSRange<Date>;
}
