import { PartialType, PickType } from '@nestjs/swagger';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistRequest extends PartialType(
  PickType(PlaylistEntity, ['name', 'description']),
) {}
