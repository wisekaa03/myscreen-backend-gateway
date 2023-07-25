import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { InvoiceEntity } from '../../database/invoice.entity';

export class InvoiceCreateRequest extends PickType(InvoiceEntity, ['sum']) {
  @ApiProperty({
    description: 'Описание заказа',
    example: 'описание заказа',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
