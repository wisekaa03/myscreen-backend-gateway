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
    example: ['1234-5678-9123-4567', '7654-3219-8765-4321'],
    isArray: true,
    required: true,
  })
  @IsDefined()
  @IsNotEmpty()
  @IsUUID('all', { each: true })
  files!: string[];
}
