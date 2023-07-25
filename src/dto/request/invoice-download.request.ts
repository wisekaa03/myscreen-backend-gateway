import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { SpecificFormat } from '../../enums/specific-format.enum';

export class InvoiceDownloadRequest {
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
}
