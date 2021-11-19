import type { Format } from 'logform';
import safeStringify from 'fast-safe-stringify';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import { transports, format } from 'winston';
import type { ConfigService } from '@nestjs/config';

const logFile = (): Format =>
  format.printf(
    ({ context, level, timestamp, message, ...meta }) =>
      `${
        typeof timestamp !== 'undefined'
          ? `${new Date(timestamp).toLocaleString()}\t`
          : `${Date.now().toLocaleString()}\t`
      }${`${level.charAt(0).toUpperCase() + level.slice(1)}\t`}${
        typeof context !== 'undefined' ? `${`[${context}]`}\t` : '\t'
      }${message}${
        typeof meta === 'object' && Object.keys(meta).length > 0
          ? `\t${safeStringify(meta)}`
          : ''
      }`,
  );

export const winstonOptions = (
  configService: ConfigService,
): WinstonModuleOptions => {
  const level = configService.get<string>('LOG_LEVEL', 'debug');
  const options = {
    handleExceptions: false,
    transports: [
      // new winston.transports.File({
      //   dirname: configService.get<string>('LOG_DIR', 'logs'),
      //   filename: 'raw-data.log',
      //   format: winston.format.combine(winston.format.timestamp(), logFile()),
      //   level: 'debug',
      // }),
      new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.ms(),
          nestWinstonModuleUtilities.format.nestLike('Nest', {
            prettyPrint: configService.get('NODE_ENV') === 'development',
          }),
        ),
        level,
      }),
    ],
  };

  // TODO: GrayLog будет у нас ?
  // if (graylog) {
  //   options.transports.push(
  //     new WinstonGraylog({
  //       level,
  //       graylog,
  //       defaultMeta: {
  //         environment: development ? 'development' : 'production',
  //       },
  //     }) as winston.transport,
  //   );
  // }

  return options;
};
