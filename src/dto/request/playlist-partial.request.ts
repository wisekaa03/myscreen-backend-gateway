import { PartialType, PickType } from '@nestjs/swagger';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistPartialRequest extends PartialType(
  PickType(PlaylistEntity, ['id', 'name', 'description']),
) {}
