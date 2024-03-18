import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class BidPrecalcPromoRequest {
  @ApiProperty({
    description: 'Мониторы для расчета',
    type: String,
    format: 'uuid',
    isArray: true,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  monitorIds!: string[];

  @ApiProperty({
    description: 'Длительность плейлиста (в секундах)',
    type: Number,
    example: 60,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  playlistDuration!: number;

  @ApiProperty({
    description: 'Дата и время начала',
    example: '2021-01-01',
    type: 'string',
    format: 'date',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  dateFrom!: string;

  @ApiProperty({
    description: 'Дата и время окончания',
    example: '2021-12-31',
    type: 'string',
    format: 'date',
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsDateString(
    { strict: false },
    { message: i18nValidationMessage('validation.IS_DATE') },
  )
  dateTo!: string;
}
