import { Global, Module, forwardRef } from '@nestjs/common';

import { DatabaseModule } from '@/database/database.module';
import { PrintService } from './print.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  imports: [forwardRef(() => DatabaseModule)],
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
