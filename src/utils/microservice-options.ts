import { AsyncModuleConfig } from '@golevelup/nestjs-modules';
import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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

export const ModuleRabbitOptions = (
  options: Partial<RabbitMQConfig>,
): AsyncModuleConfig<RabbitMQConfig> => ({
  useFactory: (configService: ConfigService): RabbitMQConfig => {
    const uri = `amqp://${configService.getOrThrow('RABBITMQ_USERNAME')}:${configService.getOrThrow('RABBITMQ_PASSWORD')}@${configService.getOrThrow('RABBITMQ_HOST')}:${configService.getOrThrow('RABBITMQ_PORT')}`;
    return {
      ...options,
      uri,
      logger: new Logger('RabbitMQ'),
      connectionInitOptions: { wait: false },
    };
  },
  imports: [ConfigModule],
  inject: [ConfigService],
});
