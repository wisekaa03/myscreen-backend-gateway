import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistUpdateRequest extends PartialType(
  PickType(PlaylistEntity, ['name', 'description']),
) {
  @ApiProperty({
    description: 'Файлы',
    example: ['1234-5678-9123-4567', '7654-3219-8765-4321'],
    type: 'string',
    format: 'uuid',
    isArray: true,
    required: false,
  })
  @IsUUID('all', { each: true })
  files!: string[];
}
