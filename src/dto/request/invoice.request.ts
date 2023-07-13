import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';

import { SpecificFormat } from '@/enums/invoice-format.enum';

export class InvoiceRequest {
  @ApiProperty({
    description: 'Формат получаемого файла',
    enum: SpecificFormat,
    enumName: 'InvoiceFormat',
    example: SpecificFormat.XLSX,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(SpecificFormat)
  format!: SpecificFormat;

  @ApiProperty({
    description: 'Сумма счета',
    example: 1000,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  sum!: number;
}
