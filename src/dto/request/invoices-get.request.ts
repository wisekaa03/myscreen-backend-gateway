import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { InvoiceEntity } from '@/database/invoice.entity';
import { LimitRequest } from './limit.request';
import { InvoicesRequest } from './invoices.request';

export class InvoicesGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: InvoicesRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InvoicesRequest)
  where?: FindOptionsWhere<InvoicesRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(InvoiceEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsArray()
  select?: FindOptionsSelect<InvoicesRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<InvoicesRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<InvoicesRequest>)
  scope?: LimitRequest<InvoicesRequest>;
}
