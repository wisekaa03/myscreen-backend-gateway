import { Global, Module, forwardRef } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@/database/database.module';
import { CrontabService } from './crontab.service';

@Global()
@Module({
  imports: [forwardRef(() => DatabaseModule), ScheduleModule.forRoot()],
  providers: [CrontabService],
  exports: [CrontabService],
})
export class CrontabModule {}
