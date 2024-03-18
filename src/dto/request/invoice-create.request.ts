import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { i18nValidationMessage } from 'nestjs-i18n';
import { InvoiceEntity } from '@/database/invoice.entity';

export class InvoiceCreateRequest extends PickType(InvoiceEntity, ['sum']) {
  @ApiProperty({
    description: 'Описание заказа',
    example: 'описание заказа',
    required: false,
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  description?: string;
}
