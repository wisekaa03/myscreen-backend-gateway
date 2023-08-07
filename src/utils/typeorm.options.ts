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
    return {
      type: this.configService.get<any>('DB_TYPE', 'postgres'),
      host: this.configService.get<string>('DB_HOST'),
      port: parseInt(this.configService.get<string>('DB_PORT', '5432'), 10),
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_DATABASE'),
      nativeDriver: true,
      logging: this.configService
        .get<string>('LOG_LEVEL', 'debug')
        .split(',') as LogLevel[],
      logger: new TypeOrmLogger(),
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
