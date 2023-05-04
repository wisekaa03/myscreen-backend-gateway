import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { InvoiceFormat } from '@/enums/invoice-format.enum';

export class InvoiceRequest {
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
}
