import { PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, MinLength } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistPartialRequest extends PartialType(
  PickType(PlaylistEntity, ['id', 'name', 'description']),
) {
  @IsOptional()
  @MinLength(0)
  name!: string;
}
