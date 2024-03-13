import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator';

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
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsUUID('all', { each: true })
  files!: string[];
}
