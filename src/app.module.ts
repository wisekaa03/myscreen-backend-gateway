import { Module, Logger } from '@nestjs/common';
import 'dotenv';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';
import { TransportTargetOptions, LevelWithSilent } from 'pino';
import type pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import 'pino-elasticsearch';
import type { ClientOptions as ElasticClientOptions } from '@elastic/elasticsearch';
import { LoggerModule, Params as NestPinoParams } from 'nestjs-pino';

import { S3ModuleOptionsClass } from './utils/s3-module-options-class';
import { MailModule } from './mail/mail.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EndpointModule } from './endpoint/endpoint.module';
import { WSModule } from './websocket/ws.module';
import { PrintModule } from './print/print.module';
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
      useFactory: async (
        configService: ConfigService,
      ): Promise<NestPinoParams> => {
        const targets: TransportTargetOptions[] = [];

        // Pretty-print
        const prettyPrint: pino.TransportTargetOptions<PrettyOptions> = {
          target:
            process.env.NODE_ENV === 'test'
              ? 'pino-pretty'
              : `${__dirname}/utils/pino-pretty.cjs`,
          options: {
            colorize: process.env.NODE_ENV !== 'production',
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            singleLine: true,
            ignore: 'pid,hostname',
          },
          level: configService.get<LevelWithSilent>('LOG_LEVEL', 'debug'),
        };
        targets.push(prettyPrint);

        // TODO: add support for pino-elasticsearch
        const kibanaHost = configService.get<string>('KIBANA_HOST');
        if (kibanaHost) {
          const kibana: pino.TransportTargetOptions<ElasticClientOptions> = {
            target: 'pino-elasticsearch',
            options: {
              node: kibanaHost,
              compression: 'gzip',
            },
            level: configService.get<LevelWithSilent>('LOG_LEVEL', 'debug'),
          };
          targets.push(kibana);
        }

        return {
          pinoHttp: {
            level: configService.get<LevelWithSilent>('LOG_LEVEL', 'debug'),
            transport: { targets },
            autoLogging: false,
          },
        };
      },
      inject: [ConfigService],
    }),

    AuthModule,
    MailModule,
    PrintModule,
    CrontabModule,
    WSModule,
    S3Module.forRootAsync({
      useClass: S3ModuleOptionsClass,
      inject: [ConfigService],
    }),
    DatabaseModule,
    EndpointModule,
  ],
  providers: [Logger],
})
export class AppModule {}
