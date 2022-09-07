import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

import { UserEntity } from '@/database/user.entity';

export class UserPartialRequest extends PartialType(
  OmitType(UserEntity, ['createdAt', 'updatedAt']),
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
