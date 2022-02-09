import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { WSGateway } from './ws.gateway';

@Module({
  imports: [AuthModule],
  providers: [WSGateway],
  exports: [WSGateway],
})
export class WSModule {}
