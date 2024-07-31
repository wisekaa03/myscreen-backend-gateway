import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export const MicroserviceOptions = (
  name: string,
  options?: RmqOptions['options'],
) => ({
  name,
  useFactory: (configService: ConfigService) =>
    ({
      transport: Transport.RMQ,
      options: {
        urls: [
          {
            hostname: configService.getOrThrow('RABBITMQ_HOST'),
            port: parseInt(configService.getOrThrow('RABBITMQ_PORT'), 10),
            username: configService.getOrThrow('RABBITMQ_USERNAME'),
            password: configService.getOrThrow('RABBITMQ_PASSWORD'),
          },
        ],
        queue: name,
        queueOptions: {
          durable: true,
        },
        ...options,
      },
    }) as RmqOptions,
  inject: [ConfigService],
});
