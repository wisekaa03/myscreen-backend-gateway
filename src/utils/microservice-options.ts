import { ConfigService } from '@nestjs/config';
import { RmqOptions, Transport } from '@nestjs/microservices';

export const MicroserviceOptions = (
  configService: ConfigService,
  name: string,
  options?: RmqOptions['options'],
): RmqOptions => ({
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
      durable: false,
      autoDelete: true,
    },
    ...options,
  },
});

export const ModuleMicroserviceOptions = (
  name: string,
  options?: RmqOptions['options'],
) => ({
  name,
  useFactory: (configService: ConfigService): RmqOptions =>
    MicroserviceOptions(configService, name, options),
  inject: [ConfigService],
});
