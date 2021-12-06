import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyObject, IsObject, Max, Min } from 'class-validator';

import { MediaEntity } from '@/database/media.entity';

export type OrderDirection = 'ASC' | 'DESC';

export type OrderRequest<T = MediaEntity> = {
  [P in keyof T]?: OrderDirection;
};

export class LimitRequest<T = MediaEntity> {
  @ApiProperty({
    description: 'Лимит строк результатов',
    example: 20,
    required: false,
  })
  @Min(5)
  @Max(100)
  limit: number;

  @ApiProperty({
    description: 'Страница результатов',
    example: 1,
    required: false,
  })
  @Min(1)
  @Max(100)
  page: number;

  @ApiProperty({
    description: 'Порядок результатов',
    type: 'OrderRequest',
    example: { name: 'ASC', createdAt: 'DESC' },
    required: false,
  })
  @IsObject()
  @IsNotEmptyObject()
  order: OrderRequest<T>;
}
