import util from 'node:util';
import { Logger } from '@nestjs/common';
import { Logger as IMailLogger, LoggerLevel } from 'nodemailer/lib/shared';
import { MailService } from '@/mail/mail.service';

export class MailLogger implements IMailLogger {
  private readonly logger = new Logger(MailService.name);

  level(level: LoggerLevel) {
    // eslint-disable-next-line no-debugger
    debugger;
  }

  trace(param: Record<string, string>, ...params: string[]): void {
    const print = util.format(...params);
    this.logger.verbose(print);
  }

  debug(param: Record<string, string>, ...params: string[]): void {
    const print = util.format(...params);
    this.logger.debug(print);
  }

  info(param: Record<string, string>, ...params: string[]): void {
    const print = util.format(...params);
    this.logger.log(print);
  }

  warn(param: Record<string, string>, ...params: string[]): void {
    const print = util.format(...params);
    this.logger.warn(print);
  }

  error(param: Record<string, string>, ...params: string[]): void {
    const print = util.format(...params);
    this.logger.error(print);
  }

  fatal(param: Record<string, string>, ...params: string[]): void {
    const print = util.format(...params);
    this.logger.error(print);
  }
}
