import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { SpecificFormat } from '../../enums/specific-format.enum';
import { InvoiceEntity } from '../../database/invoice.entity';

export class InvoiceDownloadRequest extends PickType(InvoiceEntity, ['id']) {
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
