import { Global, Module } from '@nestjs/common';

import { PrintService } from './print.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  providers: [PrintService],
  exports: [PrintService],
})
export class PrintModule {}
