import { Global, Module } from '@nestjs/common';

import { XlsxService } from './xlsx.service';

// TODO: заменить это все микросервисной архитектурой

@Global()
@Module({
  providers: [XlsxService],
  exports: [XlsxService],
})
export class XlsxModule {}
