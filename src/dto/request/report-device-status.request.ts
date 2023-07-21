import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty } from 'class-validator';

import { SpecificFormat } from '../../enums/specific-format.enum';

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
