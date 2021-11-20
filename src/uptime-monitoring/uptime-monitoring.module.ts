import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UptimeMonitoringEntity } from './uptime-monitoring.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UptimeMonitoringEntity])],
  providers: [Logger],
})
export class UptimeMonitoringModule {}
