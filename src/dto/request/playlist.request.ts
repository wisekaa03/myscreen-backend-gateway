import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, MinLength } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';
import { MSRange, MSRangeEnum } from '@/interfaces';
import { PlaylistStatusEnum } from '@/enums';

export class PlaylistRequest extends PartialType(
  PickType(PlaylistEntity, ['id', 'name', 'description']),
) {
  @IsOptional()
  @MinLength(0)
  name!: string;

  @ApiProperty({
    description: 'Статус',
    enum: PlaylistStatusEnum,
    enumName: 'PlaylistStatus',
    example: {
      range: [PlaylistStatusEnum.Offline, PlaylistStatusEnum.Broadcast],
    },
    isArray: true,
    required: false,
  })
  @IsEnum(PlaylistStatusEnum, { each: true })
  status!: MSRangeEnum<PlaylistStatusEnum>;

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
