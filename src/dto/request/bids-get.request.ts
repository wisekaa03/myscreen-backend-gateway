import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { BidEntity } from '@/database/bid.entity';
import { LimitRequest } from './limit.request';
import { BidRequest } from './bid.request';

export class BidsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: BidRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BidRequest)
  where?: FindOptionsWhere<BidRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(BidEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsArray()
  select?: FindOptionsSelect<BidRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<BidRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<BidRequest>)
  scope?: LimitRequest<BidRequest>;
}
