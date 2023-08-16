import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { LimitOrderRequest } from './limit-order.request';

export class LimitRequest<T = Record<string, 'DESC' | 'ASC'>> {
  @ApiProperty({
    description: 'Лимит строк результатов',
    example: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Страница результатов',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  @Min(1)
  @Max(100)
  page?: number;

  @ApiProperty({
    description: 'Порядок результатов',
    example: { createdAt: 'DESC' },
    required: false,
  })
  @IsOptional()
  // @ValidateNested()
  @Type(() => LimitOrderRequest<T>)
  order?: LimitOrderRequest<T>;
}
