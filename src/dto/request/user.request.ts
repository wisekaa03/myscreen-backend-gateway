import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

import { UserEntity } from '@/database/user.entity';
import { MSRange } from '@/interfaces';

export class UserRequest extends PartialType(
  OmitType(UserEntity, ['createdAt', 'updatedAt']),
) {
  @ApiProperty({
    description: 'Время создания',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: MSRange<Date>;

  @ApiProperty({
    description: 'Время изменения',
    oneOf: [
      { type: 'string', format: 'date-time' },
      { type: 'array', items: { type: 'string', format: 'date-time' } },
    ],
    examples: {
      one: '2021-12-31T10:10:10',
      range: ['2021-12-31T10:10:10', '2022-12-31T10:10:10'],
    },
    format: 'date-time',
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: MSRange<Date>;
}
