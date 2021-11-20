import { Module, Logger } from '@nestjs/common';
import { EndpointController } from './endpoint.controller';

@Module({
  controllers: [EndpointController],
  providers: [Logger],
})
export class EndpointModule {}
