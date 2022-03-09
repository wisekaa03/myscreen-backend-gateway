import { ApiProperty } from '@nestjs/swagger';
import { IsObject, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitOrderRequest } from './limit-order.request';

export class LimitRequest<T = Record<string, 'DESC' | 'ASC'>> {
  @ApiProperty({
    description: 'Лимит строк результатов',
    example: 20,
    required: false,
  })
  @Min(5)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Страница результатов',
    example: 1,
    required: false,
  })
  @Min(1)
  @Max(100)
  page?: number;

  @ApiProperty({
    description: 'Порядок результатов',
    example: { createdAt: 'DESC' },
    required: false,
  })
  @IsObject()
  // @ValidateNested()
  @Type(() => LimitOrderRequest)
  order?: LimitOrderRequest;
}
