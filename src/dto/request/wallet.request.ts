import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsEnum } from 'class-validator';

import { WalletTransactionType } from '@/enums';
import { MSRange, MSRangeEnum } from '@/interfaces';
import { WalletEntity } from '@/database/wallet.entity';

export class WalletRequest extends PartialType(
  OmitType(WalletEntity, ['type', 'createdAt', 'updatedAt']),
) {
  @ApiProperty({
    type: 'enum',
    description: 'Тип транзакции',
    enum: WalletTransactionType,
    enumName: 'WalletTransactionType',
    example: {
      range: [WalletTransactionType.DEBIT, WalletTransactionType.CREDIT],
    },
    isArray: true,
    required: false,
  })
  @IsEnum(WalletTransactionType, { each: true })
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
