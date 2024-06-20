import * as nodePath from 'node:path';
import { Module, Logger } from '@nestjs/common';
import 'dotenv';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3-aws';
import { TransportTargetOptions, LevelWithSilent } from 'pino';
import type pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import 'pino-elasticsearch';
import type { ClientOptions as ElasticClientOptions } from '@elastic/elasticsearch';
import { LoggerModule, Params as NestPinoParams } from 'nestjs-pino';
import { I18nModule } from 'nestjs-i18n';
import {
  ClientsModule,
  Transport,
  ProducerSerializer,
  ProducerDeserializer,
} from '@nestjs/microservices';

import { EDITOR_SERVICE, FILE_SERVICE, MAIL_SERVICE } from '@/constants';
import { S3ModuleOptionsClass } from './utils/s3-module-options-class';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EndpointModule } from './endpoint/endpoint.module';
import { WSModule } from './websocket/ws.module';
import { CrontabModule } from './crontab/crontab.module';
import { UserLanguageResolver } from './i18n/userLanguageResolver';

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
          level: configService.getOrThrow<LevelWithSilent>('LOG_LEVEL'),
        };
        targets.push(prettyPrint);

        // TODO: add support for pino-elasticsearch
        const kibanaHost = configService.get<string>('KIBANA_HOST');
        if (kibanaHost) {
          const kibana: pino.TransportTargetOptions<ElasticClientOptions> = {
            target: 'pino-elasticsearch',
            options: {
              node: kibanaHost,
              compression: true,
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

    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
        {
          name: MAIL_SERVICE,
          useFactory: (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
              urls: [
                {
                  hostname: configService.getOrThrow('RABBITMQ_HOST'),
                  port: parseInt(configService.getOrThrow('RABBITMQ_PORT'), 10),
                  username: configService.getOrThrow('RABBITMQ_USERNAME'),
                  password: configService.getOrThrow('RABBITMQ_PASSWORD'),
                },
              ],
              queue: 'mail_queue',
              queueOptions: {
                durable: true,
              },
              serializer: {
                serialize: (value) => ({
                  ...value,
                  data: JSON.stringify(value.data),
                }),
              } as ProducerSerializer,
              deserializer: {
                deserialize: (value) => ({
                  ...value,
                  response:
                    value.response?.type === 'Buffer'
                      ? Buffer.from(value.response)
                      : value.response,
                }),
              } as ProducerDeserializer,
            },
          }),
          inject: [ConfigService],
        },
        {
          name: EDITOR_SERVICE,
          useFactory: (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
              urls: [
                {
                  hostname: configService.getOrThrow('RABBITMQ_HOST'),
                  port: parseInt(configService.getOrThrow('RABBITMQ_PORT'), 10),
                  username: configService.getOrThrow('RABBITMQ_USERNAME'),
                  password: configService.getOrThrow('RABBITMQ_PASSWORD'),
                },
              ],
              queue: 'editor_queue',
              queueOptions: {
                durable: true,
              },
              serializer: {
                serialize: (value) => ({
                  ...value,
                  data: JSON.stringify(value.data),
                }),
              } as ProducerSerializer,
              deserializer: {
                deserialize: (value) => ({
                  ...value,
                  response:
                    value.response?.type === 'Buffer'
                      ? Buffer.from(value.response)
                      : value.response,
                }),
              } as ProducerDeserializer,
            },
          }),
          inject: [ConfigService],
        },
        {
          name: FILE_SERVICE,
          useFactory: (configService: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
              urls: [
                {
                  hostname: configService.getOrThrow('RABBITMQ_HOST'),
                  port: parseInt(configService.getOrThrow('RABBITMQ_PORT'), 10),
                  username: configService.getOrThrow('RABBITMQ_USERNAME'),
                  password: configService.getOrThrow('RABBITMQ_PASSWORD'),
                },
              ],
              queue: 'file_queue',
              queueOptions: {
                durable: true,
              },
              serializer: {
                serialize: (value) => ({
                  ...value,
                  data: JSON.stringify(value.data),
                }),
              } as ProducerSerializer,
              deserializer: {
                deserialize: (value) => ({
                  ...value,
                  response:
                    value.response?.type === 'Buffer'
                      ? Buffer.from(value.response)
                      : value.response,
                }),
              } as ProducerDeserializer,
            },
          }),
          inject: [ConfigService],
        },
      ],
    }),

    CrontabModule,
    WSModule,
    S3Module.forRootAsync({
      useClass: S3ModuleOptionsClass,
      inject: [ConfigService],
    }),
    DatabaseModule,
    EndpointModule,

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
  providers: [Logger],
})
export class AppModule {}
