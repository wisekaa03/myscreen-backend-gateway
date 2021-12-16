import {
  utilities as nestWinstonModuleUtilities,
  type WinstonModuleOptions,
} from 'nest-winston';
import { transports, format } from 'winston';
import type { ConfigService } from '@nestjs/config';

export const winstonOptions = (
  configService: ConfigService,
): WinstonModuleOptions => {
  const level = configService.get<string>('LOG_LEVEL', 'debug');
  const options = {
    handleExceptions: false,
    transports: [
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
