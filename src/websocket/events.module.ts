import { Module } from '@nestjs/common';
import { AuthGatewayProvider } from './auth.gateway';
import { FileGatewayProvider } from './file.gateway';

@Module({
  providers: [AuthGatewayProvider],
})
export class EventsModule {}
