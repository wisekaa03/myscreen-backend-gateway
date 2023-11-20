import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

import { EditorEntity } from '@/database/editor.entity';

export class EditorRequest extends PartialType(
  PickType(EditorEntity, ['id', 'name', 'renderingStatus']),
) {
  @ApiProperty({
    description: 'Время создания',
    example: ['2021-01-01', '2021-12-31'],
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    example: ['2021-01-01', '2021-12-31'],
    examples: {
      one: '2021-01-01',
      two: ['2021-12-30', '2021-12-31T10:10:10'],
    },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
