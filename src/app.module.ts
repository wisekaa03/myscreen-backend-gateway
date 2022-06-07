import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';
import type pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import type { ClientOptions as ElasticClientOptions } from '@elastic/elasticsearch';
import { LoggerModule, Params as NestPinoParams } from 'nestjs-pino';

import { S3ModuleOptionsClass } from '@/shared/s3-module-options-class';
import { MailModule } from '@/mail/mail.module';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/auth/auth.module';
import { EndpointModule } from '@/endpoint/endpoint.module';
import { WSModule } from '@/websocket/ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRootAsync({
      useFactory: async (
        configService: ConfigService,
      ): Promise<NestPinoParams> => {
        const targets: pino.TransportTargetOptions[] = [];

        // Pretty-print
        const prettyPrint: pino.TransportTargetOptions<PrettyOptions> = {
          target:
            process.env.NODE_ENV === 'test'
              ? 'pino-pretty'
              : `${__dirname}/shared/pino-pretty.js`,
          options: {
            colorize: process.env.NODE_ENV !== 'production',
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            singleLine: true,
            ignore: 'pid,hostname',
          },
          level: configService.get<pino.LevelWithSilent>('LOG_LEVEL', 'debug'),
        };
        targets.push(prettyPrint);

        // ElasticSearch
        const kibanaHost = configService.get<string>('KIBANA_HOST');
        if (kibanaHost) {
          const kibana: pino.TransportTargetOptions<ElasticClientOptions> = {
            target: 'pino-elasticsearch',
            options: {
              // TODO
            },
            level: configService.get<pino.LevelWithSilent>(
              'LOG_LEVEL',
              'debug',
            ),
          };
          targets.push(kibana);
        }

        return {
          pinoHttp: {
            level: configService.get<pino.LevelWithSilent>(
              'LOG_LEVEL',
              'debug',
            ),
            transport: { targets },
            autoLogging: false,
          },
        };
      },
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
  providers: [Logger],
})
export class AppModule {}
