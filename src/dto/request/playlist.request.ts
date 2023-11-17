import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional, MinLength } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistRequest extends PartialType(
  PickType(PlaylistEntity, ['id', 'name', 'description', 'status']),
) {
  @IsOptional()
  @MinLength(0)
  name!: string;

  @ApiProperty({
    description: 'Время создания',
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  createdAt?: Array<Date>;

  @ApiProperty({
    description: 'Время изменения',
    examples: { one: '2021-01-01', two: ['2021-12-31', '2021-12-31'] },
    type: 'string',
    format: 'date-time',
    isArray: true,
    required: false,
  })
  @IsDateString({ strict: false }, { each: true })
  updatedAt?: Array<Date>;
}
