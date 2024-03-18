import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { InvoiceEntity } from '@/database/invoice.entity';
import { LimitRequest } from './limit.request';
import { InvoiceRequest } from './invoice.request';

export class InvoicesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: InvoiceRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoiceRequest)
  where?: FindOptionsWhere<InvoiceRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(InvoiceEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsArray()
  select?: FindOptionsSelect<InvoiceRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<InvoiceRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<InvoiceRequest>)
  scope?: LimitRequest<InvoiceRequest>;
}
