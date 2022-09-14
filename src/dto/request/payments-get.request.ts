import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '../../shared/swagger-get-model-properties';
import { PaymentEntity } from '../../database/payment.entity';
import { LimitRequest } from './limit.request';
import { PaymentRequest } from './payment.request';

export class PaymentsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: PaymentRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentRequest)
  where?: FindOptionsWhere<PaymentRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(PaymentEntity),
    isArray: true,
    required: false,
  })
  @IsOptional()
  select?: FindOptionsSelect<PaymentRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope?: LimitRequest<PaymentRequest>;
}
