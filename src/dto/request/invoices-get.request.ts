import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { InvoiceEntity } from '@/database/invoice.entity';
import { LimitRequest } from './limit.request';
import { InvoicePartialRequest } from './invoice-partial.request';

export class InvoicesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: InvoicePartialRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoicePartialRequest)
  where?: FindOptionsWhere<InvoicePartialRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(InvoiceEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<InvoicePartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<InvoicePartialRequest>;
}
