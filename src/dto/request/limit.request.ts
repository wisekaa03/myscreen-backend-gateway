import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsOptional, Max, Min } from 'class-validator';

export type LimitOrderDirection = 'ASC' | 'DESC';

export type LimitOrderRequest<T> = {
  [P in keyof T]?: LimitOrderDirection;
};

export class LimitRequest<T = any> {
  @ApiProperty({
    description: 'Лимит строк результатов',
    example: 20,
    required: false,
  })
  @Min(5)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Страница результатов',
    example: 1,
    required: false,
  })
  @Min(1)
  @Max(100)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Порядок результатов',
    type: 'OrderRequest',
    example: { createdAt: 'DESC' },
    required: false,
  })
  @IsOptional()
  @Allow()
  order?: LimitOrderRequest<T>;
}
