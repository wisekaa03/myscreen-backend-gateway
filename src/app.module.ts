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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        pinoHttp: {
          transport: {
            targets: [
              {
                target: `${__dirname}/shared/pino-pretty.js`,
                options: {
                  colorize: true,
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

    MailModule,
    S3Module.forRootAsync({
      useClass: S3ModuleOptionsClass,
      inject: [ConfigService],
    }),

    DatabaseModule,
    AuthModule,
    EndpointModule,
  ],
  providers: [Logger],
})
export class AppModule {}
