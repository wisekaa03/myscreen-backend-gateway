import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty } from 'class-validator';

import { InvoiceFormat } from '../../enums/invoice-format.enum';

export class ReportDeviceStatusRequest {
  @ApiProperty({
    description: 'Формат получаемого файла',
    enum: InvoiceFormat,
    enumName: 'InvoiceFormat',
    example: InvoiceFormat.XLSX,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(InvoiceFormat)
  format!: InvoiceFormat;

  @ApiProperty({
    description: 'Начальная дата',
    example: '2023-05-01',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  dateFrom!: Date;

  @ApiProperty({
    description: 'Конечная дата',
    example: '2023-05-01',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  dateTo!: Date;
}
