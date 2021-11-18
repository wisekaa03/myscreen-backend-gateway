import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { TypeOrmLogger } from './logger.typeorm';

@Injectable()
export class TypeOrmOptionsService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_DATABASE', 'postgres'),
      logging: this.configService.get('LOG_LEVEL', 'debug').split(','),
      logger: new TypeOrmLogger(),
      entities: [],
      synchronize: true,
      autoLoadEntities: true,
      cache: this.configService.get('REDIS_HOST')
        ? {
            type: 'ioredis',
            options: {
              clientName: 'DATABASE',
              host: this.configService.get('REDIS_HOST') || 'redis',
              port: this.configService.get('REDIS_PORT') || 6379,
              db: 0,
              keyPrefix: 'DATABASE:',
            },
            alwaysEnabled: true,
            duration: 15 * 60 * 1000,
          }
        : undefined,
    };
  }
}
