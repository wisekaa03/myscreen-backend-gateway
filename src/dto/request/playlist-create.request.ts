import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistCreateRequest extends PickType(PlaylistEntity, [
  'name',
  'description',
]) {
  @ApiProperty({
    description: 'Файлы',
    type: 'string',
    format: 'uuid',
    isArray: true,
  })
  @IsArray()
  files!: string[];
}
