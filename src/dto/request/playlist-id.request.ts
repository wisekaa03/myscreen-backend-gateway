import { PickType } from '@nestjs/swagger';

import { PlaylistEntity } from '@/database/playlist.entity';

export class PlaylistIDRequest extends PickType(PlaylistEntity, ['id']) {}
