import { Global, Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { XlsxService } from './xlsx.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [XlsxService],
  exports: [XlsxService],
})
export class XlsxModule {}
