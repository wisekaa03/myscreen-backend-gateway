import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { SpecificFormat } from '../../enums/specific-format.enum';
import { OrderEntity } from '../../database/order.entity';

export class OrderDownloadRequest extends PickType(OrderEntity, ['id']) {
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
