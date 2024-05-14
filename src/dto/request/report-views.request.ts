import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { SpecificFormat } from '@/enums/specific-format.enum';

export class ReportViewsRequest {
  @ApiProperty({
    description: 'Формат получаемого файла',
    enum: SpecificFormat,
    enumName: 'SpecificFormat',
    example: SpecificFormat.XLSX,
    required: true,
  })
  @IsDefined({ message: i18nValidationMessage('validation.IS_DEFINED') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  @IsEnum(SpecificFormat, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  format!: SpecificFormat;

  @ApiProperty({
    description: 'Мониторы ID (если не указан, то все мониторы)',
    example: ['1234-5678-9123-4567', '7654-3219-8765-4321'],
    isArray: true,
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('all', {
    each: true,
    message: i18nValidationMessage('validation.IS_UUID'),
  })
  monitorIds?: string[];

  @ApiProperty({
    description: 'Начальная дата',
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
    description: 'Конечная дата',
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
  dateTo!: string;
}
