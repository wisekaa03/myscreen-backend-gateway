import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsDefined,
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
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(SpecificFormat)
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
  @IsUUID(undefined, { each: true })
  monitorsId?: Array<string>;

  @ApiProperty({
    description: 'Начальная дата',
    example: '2021-01-01',
    type: 'string',
    format: 'date',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateFrom!: string;

  @ApiProperty({
    description: 'Конечная дата',
    example: '2021-01-01',
    type: 'string',
    format: 'date',
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateTo!: string;
}
