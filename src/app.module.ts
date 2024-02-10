import { Module, Logger, NestModule, MiddlewareConsumer } from '@nestjs/common';
import 'dotenv';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';
import { TransportTargetOptions, LevelWithSilent } from 'pino';
import type pino from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import 'pino-elasticsearch';
import type { ClientOptions as ElasticClientOptions } from '@elastic/elasticsearch';
import { LoggerModule, Params as NestPinoParams } from 'nestjs-pino';
import {
  ClientsModule,
  Transport,
  ProducerSerializer,
  ProducerDeserializer,
} from '@nestjs/microservices';

import { EDITOR_SERVICE, FILE_SERVICE, MAIL_SERVICE } from '@/interfaces';
import { S3ModuleOptionsClass } from './utils/s3-module-options-class';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EndpointModule } from './endpoint/endpoint.module';
import { WSModule } from './websocket/ws.module';
import { CrontabModule } from './crontab/crontab.module';
import { RedirectMiddleware } from './exception/redirect.middleware';

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
                  hostname: configService.get<string>(
                    'RABBITMQ_HOST',
                    'localhost',
                  ),
                  port: configService.get<number>('RABBITMQ_PORT', 5672),
                  username: configService.get<string>(
                    'RABBITMQ_USERNAME',
                    'guest',
                  ),
                  password: configService.get<string>(
                    'RABBITMQ_PASSWORD',
                    'guest',
                  ),
                },
              ],
              queue: 'mail_queue',
              queueOptions: {
                durable: true,
              },
              serializer: <ProducerSerializer>{
                serialize: (value) => ({
                  ...value,
                  data: JSON.stringify(value.data),
                }),
              },
              deserializer: <ProducerDeserializer>{
                deserialize: (value) => ({
                  ...value,
                  response:
                    value.response?.type === 'Buffer'
                      ? Buffer.from(value.response)
                      : value.response,
                }),
              },
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
                  hostname: configService.get<string>(
                    'RABBITMQ_HOST',
                    'localhost',
                  ),
                  port: configService.get<number>('RABBITMQ_PORT', 5672),
                  username: configService.get<string>(
                    'RABBITMQ_USERNAME',
                    'guest',
                  ),
                  password: configService.get<string>(
                    'RABBITMQ_PASSWORD',
                    'guest',
                  ),
                },
              ],
              queue: 'editor_queue',
              queueOptions: {
                durable: true,
              },
              serializer: <ProducerSerializer>{
                serialize: (value) => ({
                  ...value,
                  data: JSON.stringify(value.data),
                }),
              },
              deserializer: <ProducerDeserializer>{
                deserialize: (value) => ({
                  ...value,
                  response:
                    value.response?.type === 'Buffer'
                      ? Buffer.from(value.response)
                      : value.response,
                }),
              },
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
                  hostname: configService.get<string>(
                    'RABBITMQ_HOST',
                    'localhost',
                  ),
                  port: configService.get<number>('RABBITMQ_PORT', 5672),
                  username: configService.get<string>(
                    'RABBITMQ_USERNAME',
                    'guest',
                  ),
                  password: configService.get<string>(
                    'RABBITMQ_PASSWORD',
                    'guest',
                  ),
                },
              ],
              queue: 'file_queue',
              queueOptions: {
                durable: true,
              },
              serializer: <ProducerSerializer>{
                serialize: (value) => ({
                  ...value,
                  data: JSON.stringify(value.data),
                }),
              },
              deserializer: <ProducerDeserializer>{
                deserialize: (value) => ({
                  ...value,
                  response:
                    value.response?.type === 'Buffer'
                      ? Buffer.from(value.response)
                      : value.response,
                }),
              },
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
  ],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RedirectMiddleware).forRoutes('*');
  }
}
