import { Module, forwardRef } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { DatabaseModule } from '@/database/database.module';
import { WSGateway } from './ws.gateway';

@Module({
  imports: [AuthModule, forwardRef(() => DatabaseModule)],
  providers: [WSGateway],
  exports: [WSGateway],
})
export class WSModule {}
