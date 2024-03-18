import { resolve as pathResolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  TypeOrmOptionsFactory,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';

import { LogLevel } from 'typeorm';
import { TypeOrmLogger } from './typeorm.logger';

@Injectable()
export class TypeOrmOptionsClass implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    const cacheHost = this.configService.get<string>('REDIS_HOST');
    const logLevel = this.configService.get<string>('LOG_LEVEL');
    return {
      type: this.configService.getOrThrow<string>('DB_TYPE') as any,
      host: this.configService.getOrThrow('DB_HOST'),
      port: parseInt(this.configService.getOrThrow('DB_PORT'), 10),
      username: this.configService.getOrThrow('DB_USERNAME'),
      password: this.configService.getOrThrow('DB_PASSWORD'),
      database: this.configService.getOrThrow<string>('DB_DATABASE'),
      ssl: this.configService.getOrThrow('DB_SSL') === 'true',
      nativeDriver: true,
      logging: logLevel ? (logLevel.split(',') as LogLevel[]) : false,
      logger: logLevel ? new TypeOrmLogger() : undefined,
      synchronize: true,
      entities: [`${pathResolve(__dirname, '..')}/database/*.entity.{ts,js}`],
      migrations: [`${pathResolve(__dirname, '..')}/migrations/*.{ts,js}`],
      migrationsRun: false,
      autoLoadEntities: true,

      cache: cacheHost
        ? {
            type: 'ioredis',
            options: {
              clientName: 'DATABASE',
              host: cacheHost,
              port: parseInt(
                this.configService.get<string>('REDIS_PORT', '6379'),
                10,
              ),
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
