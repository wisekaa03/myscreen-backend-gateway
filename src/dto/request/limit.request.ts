import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsOptional, Max, Min } from 'class-validator';

export type OrderDirection = 'ASC' | 'DESC';

export type OrderRequest<T> = {
  [P in keyof T]?: OrderDirection;
};

export class LimitRequest<T> {
  @ApiProperty({
    description: 'Лимит строк результатов',
    example: 20,
    required: false,
  })
  @Min(5)
  @Max(100)
  @IsOptional()
  limit!: number;

  @ApiProperty({
    description: 'Страница результатов',
    example: 1,
    required: false,
  })
  @Min(1)
  @Max(100)
  @IsOptional()
  page!: number;

  @ApiProperty({
    description: 'Порядок результатов',
    type: 'OrderRequest',
    example: { name: 'ASC', createdAt: 'DESC' },
    required: false,
  })
  @IsOptional()
  @Allow()
  order!: OrderRequest<T>;
}
