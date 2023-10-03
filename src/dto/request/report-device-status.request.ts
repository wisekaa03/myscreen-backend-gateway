import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import subDays from 'date-fns/subDays';
import formatISO from 'date-fns/formatISO';

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
    type: Date,
    example: formatISO(subDays(new Date(), 1), { representation: 'date' }),
    required: true,
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateFrom!: string;

  @ApiProperty({
    description: 'Конечная дата',
    type: Date,
    example: formatISO(new Date(), { representation: 'date' }),
    required: true,
  })
  @IsNotEmpty()
  @IsDateString({ strict: false })
  dateTo!: string;
}
