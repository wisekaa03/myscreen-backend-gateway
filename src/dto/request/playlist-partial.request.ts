import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsDateString, IsOptional, MinLength } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistPartialRequest extends PartialType(
  PickType(PlaylistEntity, ['id', 'name', 'description']),
) {
  @IsOptional()
  @MinLength(0)
  name!: string;

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
