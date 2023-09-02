import type { LogDescriptor, LoggerOptions } from 'pino';
import pinoPretty from 'pino-pretty';

export default (opts: LoggerOptions) =>
  pinoPretty({
    ...opts,
    messageFormat: (
      log: LogDescriptor,
      messageKey: string,
      // levelLabel: string,
    ) => {
      const message = `[${log.context || 'HTTP'}] ${log[messageKey]}`;
      // eslint-disable-next-line no-param-reassign
      delete log.context;
      return message;
    },
  });
