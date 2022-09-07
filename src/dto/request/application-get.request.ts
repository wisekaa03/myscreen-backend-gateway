import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FindOptionsWhere } from 'typeorm';

import { LimitRequest } from './limit.request';
import { ApplicationPartialRequest } from './application-partial.request';

export class ApplicationGetRequest {
  @ApiProperty({
    description: 'Запрос',
    type: ApplicationPartialRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ApplicationPartialRequest)
  where!: FindOptionsWhere<ApplicationPartialRequest>;

  @ApiProperty({
    description: 'Рамки для запроса',
    type: LimitRequest,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LimitRequest)
  scope!: LimitRequest<ApplicationPartialRequest>;
}
