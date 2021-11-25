import { resolve as pathResolve } from 'path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  TypeOrmOptionsFactory,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

import { TypeOrmLogger } from './logger.typeorm';

@Injectable()
export class TypeOrmOptionsService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const cache = this.configService.get<string>('REDIS_HOST');
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get('DB_USERNAME', 'postgres'),
      password: this.configService.get('DB_PASSWORD', 'postgres'),
      database: this.configService.get('DB_DATABASE', 'postgres'),
      logging: this.configService.get('LOG_LEVEL', 'debug').split(','),
      logger: new TypeOrmLogger(),
      synchronize: true,
      entities: [`${pathResolve(__dirname, '..')}/database/*.entity.{ts,js}`],
      migrations: [`${pathResolve(__dirname, '..')}/migrations/*.{ts,js}`],
      migrationsRun: false,
      autoLoadEntities: true,

      cache: cache
        ? {
            type: 'ioredis',
            options: {
              clientName: 'DATABASE',
              host: cache,
              port: this.configService.get<number>('REDIS_PORT', 6379),
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
