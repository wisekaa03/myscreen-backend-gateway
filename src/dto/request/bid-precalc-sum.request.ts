import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class BidPrecalcSumRequest {
  @ApiProperty({
    description: 'Плэйлист ID',
    format: 'uuid',
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsUUID('all', { message: i18nValidationMessage('validation.IS_UUID') })
  playlistId!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Гарантированное минимальное количество показов в день',
    example: 1,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  minWarranty!: number;

  @ApiProperty({
    type: 'integer',
    description: 'Стоимость показа 1 секунды в рублях',
    example: 1,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  price1s!: number;

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
  dateBefore!: string;

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
  dateWhen!: string;
}
