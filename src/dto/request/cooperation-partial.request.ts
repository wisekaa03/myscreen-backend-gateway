import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

import { ApplicationEntity } from '@/database/application.entity';

export class CooperationPartialRequest extends PartialType(
  OmitType(ApplicationEntity, [
    'buyer',
    'seller',
    'monitor',
    'playlist',
    'user',
    'createdAt',
    'updatedAt',
  ]),
) {
  @ApiProperty({
    description: 'Время создания',
    example: ['2021-01-01', '2021-12-31'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    example: ['2021-01-01', '2021-12-31'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
