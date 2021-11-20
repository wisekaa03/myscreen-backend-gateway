import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MonitorEntity } from './monitor.entity';
import { MonitorPlaylistMapEntity } from './monitor-playlist-map.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonitorEntity, MonitorPlaylistMapEntity]),
  ],
  providers: [Logger],
})
export class MonitorModule {}
