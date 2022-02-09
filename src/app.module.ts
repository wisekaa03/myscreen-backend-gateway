// import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';
import type pino from 'pino';
import { LoggerModule } from 'nestjs-pino';

import { S3ModuleOptionsClass } from '@/shared/s3-module-options-class';
import { MailModule } from '@/mail/mail.module';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/auth/auth.module';
import { EndpointModule } from '@/endpoint/endpoint.module';
import { WSModule } from '@/websocket/ws.module';
// import { LoggingInterceptor } from '@/intercept/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<pino.LevelWithSilent>('LOG_LEVEL', 'debug'),
          transport: {
            targets: [
              {
                target:
                  process.env.NODE_ENV === 'test'
                    ? 'pino-pretty'
                    : `${__dirname}/shared/pino-pretty.js`,
                options: {
                  colorize: process.env.NODE_ENV !== 'production',
                  translateTime: 'yyyy-mm-dd HH:MM:ss',
                  singleLine: true,
                  ignore: 'pid,hostname',
                },
                level: configService.get<pino.LevelWithSilent>(
                  'LOG_LEVEL',
                  'debug',
                ),
              },
              // TODO: Elasticsearch...
            ],
          },
        },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    MailModule,
    S3Module.forRootAsync({
      useClass: S3ModuleOptionsClass,
      inject: [ConfigService],
    }),
    DatabaseModule,
    EndpointModule,
    WSModule,
  ],
  providers: [
    Logger,
    // { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
