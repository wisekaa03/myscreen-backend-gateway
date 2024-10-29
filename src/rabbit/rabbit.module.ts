import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';

import { ModuleRabbitOptions } from '@/utils/microservice-options';
import { MSVC_EXCHANGE } from '@/enums';
import { RmqController } from './rmq.controller';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(
      RabbitMQModule,
      ModuleRabbitOptions({
        exchanges: [
          {
            name: MSVC_EXCHANGE.EDITOR,
          },
        ],
        channels: {
          gateway: {
            prefetchCount: 1,
          },
        },
      }),
    ),
  ],

  controllers: [RmqController],

  exports: [RabbitMQModule],
})
export class RabbitModule {}
