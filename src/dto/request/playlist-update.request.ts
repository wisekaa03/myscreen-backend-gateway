import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistUpdateRequest extends PartialType(
  PickType(PlaylistEntity, ['name', 'description']),
) {
  @ApiProperty({
    description: 'Файлы',
    type: 'string',
    format: 'uuid',
    isArray: true,
    required: false,
  })
  @IsArray()
  files!: string[];
}
