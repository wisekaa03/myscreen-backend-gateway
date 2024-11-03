import { AsyncModuleConfig } from '@golevelup/nestjs-modules';
import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
