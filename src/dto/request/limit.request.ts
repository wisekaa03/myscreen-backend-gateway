import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { i18nValidationMessage } from 'nestjs-i18n';
import { LimitOrderRequest } from './limit-order.request';

export class LimitRequest<T = Record<string, 'DESC' | 'ASC'>> {
  @ApiProperty({
    description: 'Лимит строк результатов',
    example: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  @Max(100, { message: i18nValidationMessage('validation.MAX') })
  limit?: number;

  @ApiProperty({
    description: 'Страница результатов',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 },
    { message: i18nValidationMessage('validation.IS_NUMBER') },
  )
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  @Max(100, { message: i18nValidationMessage('validation.MAX') })
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
