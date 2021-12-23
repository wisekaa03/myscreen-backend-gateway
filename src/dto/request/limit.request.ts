import { ApiProperty } from '@nestjs/swagger';
import { IsObject, Max, Min } from 'class-validator';

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
  order?: LimitOrderRequest<T>;
}
