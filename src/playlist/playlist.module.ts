import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PlaylistEntity } from './playlist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlaylistEntity])],
  providers: [Logger],
})
export class PlaylistModule {}
