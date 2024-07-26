import { ConfigService } from '@nestjs/config';
import type { ClientOptions as ElasticClientOptions } from '@elastic/elasticsearch';
import type { PrettyOptions } from 'pino-pretty';
import type pino from 'pino';
import type { LevelWithSilent } from 'pino';
import 'pino-elasticsearch';
import { Params as NestPinoParams } from 'nestjs-pino';

export const LoggerModuleOptions = async (
  configService: ConfigService,
): Promise<NestPinoParams> => {
  const targets: pino.TransportTargetOptions[] = [];

  // Pretty-print
  const prettyPrint: pino.TransportTargetOptions<PrettyOptions> = {
    target:
      process.env.NODE_ENV === 'test'
        ? 'pino-pretty'
        : `${__dirname}/pino-pretty.cjs`,
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
};
