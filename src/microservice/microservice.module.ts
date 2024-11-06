import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';

import { ModuleRabbitOptions } from '@/utils/microservice-options';
import { MSVC_EXCHANGE } from '@/enums';
import { GatewayService } from './gateway.service';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(
      RabbitMQModule,
      ModuleRabbitOptions({
        exchanges: [
          {
            name: MSVC_EXCHANGE.GATEWAY,
            type: 'direct',
            createExchangeIfNotExists: true,
          },
        ],
        channels: {
          gateway: {
            prefetchCount: 1,
            default: true,
          },
        },
      }),
    ),
  ],

  providers: [GatewayService],

  exports: [RabbitMQModule],
})
export class MsvcModule {}
