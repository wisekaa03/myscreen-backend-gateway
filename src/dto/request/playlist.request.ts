import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistRequest extends PartialType(
  PickType(PlaylistEntity, []),
) {}
