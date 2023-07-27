/* eslint global-require:0, @typescript-eslint/no-var-requires:0 */
import type { LogDescriptor, LoggerOptions } from 'pino';

export = (opts: LoggerOptions) =>
  require('pino-pretty')({
    ...opts,
    messageFormat: (
      log: LogDescriptor,
      messageKey: string,
      // levelLabel: string,
    ) => {
      let message: string;
      const context = log.context || 'HTTP';
      if (!log[messageKey]) {
        message = `[${context}]`;
      } else {
        message = `[${context}] ${log[messageKey]}`;
      }
      // eslint-disable-next-line no-param-reassign
      delete log.context;
      return message;
    },
  });
