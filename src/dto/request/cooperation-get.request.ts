import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsWhere } from 'typeorm';

import { LimitRequest } from './limit.request';
import { CooperationPartialRequest } from './cooperation-partial.request';

export class CooperationGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: CooperationPartialRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CooperationPartialRequest)
  where!: FindOptionsWhere<CooperationPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope!: LimitRequest<CooperationPartialRequest>;
}
