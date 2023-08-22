import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

import { SpecificFormat } from '@/enums/specific-format.enum';

export class ReportDeviceStatusRequest {
  @ApiProperty({
    description: 'Формат получаемого файла',
    enum: SpecificFormat,
    enumName: 'SpecificFormat',
    example: SpecificFormat.XLSX,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(SpecificFormat)
  format!: SpecificFormat;

  @ApiProperty({
    description: 'Мониторы ID (если не указан, то все мониторы)',
    isArray: true,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID(undefined, { each: true })
  monitorsId?: Array<string>;

  @ApiProperty({
    description: 'Начальная дата',
    example: '2022-05-01',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateFrom!: Date;

  @ApiProperty({
    description: 'Конечная дата',
    example: '2023-05-01',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateTo!: Date;
}
