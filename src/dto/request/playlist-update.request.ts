import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

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
  @IsUUID('all', { each: true })
  files!: string[];
}
