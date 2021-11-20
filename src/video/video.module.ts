import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VideoEntity } from './video.entity';
import { VideoPlaylistMapEntity } from './video-playlist-map.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VideoEntity, VideoPlaylistMapEntity])],
  providers: [Logger],
})
export class VideoModule {}
