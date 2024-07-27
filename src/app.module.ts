import * as nodePath from 'node:path';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import 'dotenv';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3-aws';
import { LoggerErrorInterceptor, LoggerModule } from 'nestjs-pino';
import { I18nModule } from 'nestjs-i18n';
import { ClientsModule } from '@nestjs/microservices';

import { MICROSERVICE_MYSCREEN } from './enums';
import { LoggerModuleOptions } from './utils/logger-module-options';
import { S3ModuleOptionsClass } from './utils/s3-module-options-class';
import { MicroserviceOptions } from './utils/microservice-options';
import { UserLanguageResolver } from './i18n/userLanguageResolver';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EndpointModule } from './endpoint/endpoint.module';
import { WSModule } from './websocket/ws.module';
import { CrontabModule } from './crontab/crontab.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),

    LoggerModule.forRootAsync({
      useFactory: LoggerModuleOptions,
      inject: [ConfigService],
    }),

    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
        MicroserviceOptions(MICROSERVICE_MYSCREEN.MAIL),
        MicroserviceOptions(MICROSERVICE_MYSCREEN.FORM),
      ],
    }),

    S3Module.forRootAsync({
      useClass: S3ModuleOptionsClass,
      inject: [ConfigService],
    }),

    DatabaseModule,
    AuthModule,
    EndpointModule,
    WSModule,
    CrontabModule,

    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.getOrThrow('LANGUAGE_DEFAULT'),
        loaderOptions: {
          path: nodePath.join(
            __dirname,
            process.env.NODE_ENV === 'test' ? 'i18n/' : '../i18n/',
          ),
          watch: true,
        },
        typesOutputPath: nodePath.join(
          __dirname,
          process.env.NODE_ENV === 'test'
            ? 'i18n/i18n.generated.ts'
            : '../i18n/i18n.generated.ts',
        ),
      }),
      resolvers: [UserLanguageResolver],
      inject: [ConfigService],
      imports: [DatabaseModule, AuthModule, ConfigModule],
    }),
  ],
  providers: [
    Logger,
    { provide: APP_INTERCEPTOR, useClass: LoggerErrorInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
