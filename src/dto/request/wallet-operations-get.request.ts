import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsSelect, FindOptionsWhere } from 'typeorm';

import { swaggerGetModelProperties } from '@/utils/swagger-get-model-properties';
import { LimitRequest } from './limit.request';
import { WalletRequest } from './wallet.request';
import { WalletEntity } from '@/database/wallet.entity';

export class WalletOperationsGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: WalletRequest,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => WalletRequest)
  where?: FindOptionsWhere<WalletRequest>;

  @ApiProperty({
    description: 'Выбрать поля',
    example: [],
    enum: swaggerGetModelProperties(WalletEntity),
    isArray: true,
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsArray()
  select?: FindOptionsSelect<WalletRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest<WalletRequest>,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LimitRequest<WalletRequest>)
  scope?: LimitRequest<WalletRequest>;
}
