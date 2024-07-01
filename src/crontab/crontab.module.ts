import { Global, Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@/database/database.module';
import { CrontabService } from './crontab.service';

@Global()
@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  providers: [CrontabService],
  exports: [CrontabService],
})
export class CrontabModule {}
