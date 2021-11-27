import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailgunService } from 'nestjs-mailgun';

import { UserEntity } from '@/database/user.entity';

@Injectable()
export class MailService {
  logger = new Logger(MailService.name);

  private host: string;

  private from: string;

  private template: string;

  constructor(
    private readonly mailgunService: MailgunService,
    private readonly configService: ConfigService,
  ) {
    this.host = configService.get<string>('MAILGUN_API_DOMAIN');
    this.from = `MyScreen <no-reply@${this.host}>`;
    this.template = 'template.user-action';
  }

  private confirmEmailText = (confirmUrl: string) =>
    `Вы указали эту почту при регистрации на MyScreen. \n\
    Для подтверждения электронной почты и завершения процесса \n\
    регистрации, пройдите, пожалуйста, по ссылке: \n\
    ${confirmUrl}`;

  private forgotPasswordText = (forgotPasswordUrl: string) =>
    `Чтобы восстановить доступ к своему аккаунту, пройдите, пожалуйста, по ссылке: \n${forgotPasswordUrl}`;

  private registerEmailText = () =>
    'Добро пожаловать в MySсreen. \n' +
    'Поздравляем с успешной регистрацией. \n' +
    'Мы рады видеть Вас в числе наших пользователей.';

  /**
   *
   * @async
   * @param {UserEntity} user User entity
   * @returns {void}
   */
  async sendWelcomeMessage(user: UserEntity): Promise<void> {
    const message = {
      from: this.from,
      to: user.email,
      subject: 'Регистрация',
      text: this.registerEmailText(),
    };

    await this.mailgunService.sendEmail({
      ...message,
      template: this.template,
      'h:X-Mailgun-Variables': JSON.stringify(message),
    });
  }

  /**
   *
   * @async
   * @param {UserEntity} user User entity
   * @param {string} verify Email validation Key
   * @returns {void}
   */
  async sendVerificationCode(
    user: UserEntity,
    confirmUrl: string,
  ): Promise<void> {
    const message = {
      from: this.from,
      to: user.email,
      subject: 'Подтверждение аккаунта',
      text: this.confirmEmailText(confirmUrl),
    };

    const variables = {
      confirmUrl,
      button: {
        url: confirmUrl,
        text: 'Подтвердить',
      },
    };

    await this.mailgunService.sendEmail({
      ...message,
      template: this.template,
      'h:X-Mailgun-Variables': JSON.stringify({
        ...message,
        ...variables,
      }),
    });
  }

  /**
   *
   * @async
   * @param {UserEntity} user User entity
   * @param {string} verify Forgot password Key
   * @returns {void}
   */
  async forgotPassword(
    user: UserEntity,
    forgotPasswordUrl: string,
  ): Promise<void> {
    const message = {
      from: this.from,
      to: user.email,
      subject: 'Сброс пароля',
      text: this.forgotPasswordText(forgotPasswordUrl),
    };

    const variables = {
      forgotPasswordUrl,
      button: {
        url: forgotPasswordUrl,
        text: 'Сбросить',
      },
    };

    await this.mailgunService.sendEmail({
      ...message,
      template: this.template,
      'h:X-Mailgun-Variables': JSON.stringify({
        ...message,
        ...variables,
      }),
    });
  }
}
