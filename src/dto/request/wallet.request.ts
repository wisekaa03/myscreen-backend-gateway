import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { WalletTransactionType } from '@/enums';
import { MSRange, MSRangeEnum } from '@/interfaces';
import { WalletEntity } from '@/database/wallet.entity';

export class WalletRequest extends PartialType(
  OmitType(WalletEntity, ['type', 'createdAt', 'updatedAt']),
) {
  @ApiProperty({
    description: 'Тип транзакции',
    enum: WalletTransactionType,
    enumName: 'WalletTransactionType',
    example: {
      range: [WalletTransactionType.DEBIT, WalletTransactionType.CREDIT],
    },
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsEnum(WalletTransactionType, {
    each: true,
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  type?: MSRangeEnum<WalletTransactionType>;

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
