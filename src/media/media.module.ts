import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MediaEntity } from './media.entity';
import { MediaEditorMapEntity } from './media-editor-map.entity';
import { MediaPlaylistMapEntity } from './media-playlist-map.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaEntity,
      MediaEditorMapEntity,
      MediaPlaylistMapEntity,
    ]),
  ],
  providers: [Logger],
})
export class MediaModule {}
