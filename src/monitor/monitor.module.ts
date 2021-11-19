import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MonitorEntity } from './monitor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MonitorEntity])],
  providers: [Logger],
})
export class MonitorModule {}
