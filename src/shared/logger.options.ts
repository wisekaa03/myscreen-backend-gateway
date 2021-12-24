import { inspect } from 'util';
import safeStringify from 'fast-safe-stringify';
import bare from 'cli-color/bare';
import clc from 'cli-color';
import { type WinstonModuleOptions } from 'nest-winston';
import { transports, format } from 'winston';
import type { ConfigService } from '@nestjs/config';

const nestLikeColorScheme: Record<string, bare.Format> = {
  info: clc.greenBright,
  error: clc.red,
  warn: clc.yellow,
  debug: clc.magentaBright,
  verbose: clc.cyanBright,
};

export const winstonOptions = (
  configService: ConfigService,
): WinstonModuleOptions => {
  const options = {
    handleExceptions: false,
    transports: [
      new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.ms(),
          format.printf(
            ({ context, level, timestamp, message, ms, ...meta }) => {
              if (typeof timestamp !== 'undefined') {
                // Only format the timestamp to a locale representation if it's ISO 8601 format.
                // Any format that is not a valid date string will throw, just ignore it
                // (it will be printed as-is).
                try {
                  if (timestamp === new Date(timestamp).toISOString()) {
                    // eslint-disable-next-line no-param-reassign
                    timestamp = new Date(timestamp).toLocaleString();
                  }
                } catch (error) {
                  // eslint-disable-next-line no-empty
                }
              }

              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              const color =
                nestLikeColorScheme[level] || ((text: string): string => text);

              const stringifiedMeta = safeStringify(meta);
              const formattedMeta: string = inspect(
                JSON.parse(stringifiedMeta),
                {
                  colors: true,
                  depth: null,
                },
              );
              return (
                `${color(level.charAt(0).toUpperCase() + level.slice(1))}\t${
                  typeof timestamp !== 'undefined' ? `${timestamp} ` : ''
                }${
                  typeof context !== 'undefined'
                    ? `${clc.yellow(`[${context}]`)} `
                    : ''
                }${color(message)}` +
                `${formattedMeta !== '{}' ? ` - ${formattedMeta}` : ''}${
                  typeof ms !== 'undefined' ? ` ${clc.yellow(ms)}` : ''
                }`
              );
            },
          ),
        ),
        level: configService.get<string>('LOG_LEVEL', 'debug'),
      }),
    ],
  };

  // DEBUG: GrayLog будет у нас ?
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
