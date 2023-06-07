import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { PrintService } from './print.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
