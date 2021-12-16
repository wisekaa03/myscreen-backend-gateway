import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailgunService, type MailgunError } from 'nestjs-mailgun';

@Injectable()
export class MailService {
  logger = new Logger(MailService.name);

  private template = 'template.user-action';

  private domain: string;

  private from: string;

  constructor(
    private readonly mailgunService: MailgunService,
    private readonly configService: ConfigService,
  ) {
    this.domain = configService.get<string>('MAILGUN_API_DOMAIN', 'localhost');
    this.from = `MyScreen <no-reply@${this.domain}>`;
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
   * Отправляет приветственное письмо
   * @async
   * @param {string} email Почта пользователя
   * @returns {any}
   */
  async sendWelcomeMessage(email: string): Promise<any> {
    const message = {
      from: this.from,
      to: email,
      subject: 'Регистрация',
      text: this.registerEmailText(),
    };

    return this.mailgunService
      .createEmail(this.domain, {
        ...message,
        template: this.template,
        'h:X-Mailgun-Variables': JSON.stringify(message),
      })
      .catch((error: MailgunError) => {
        throw new InternalServerErrorException(error);
      });
  }

  /**
   * Отправляет письмо, подтверждающее пользователя
   * @async
   * @param {string} email Почта пользователя
   * @param {string} confirmUrl URL по которому нужно пройти
   * @returns {any}
   */
  async sendVerificationCode(email: string, confirmUrl: string): Promise<any> {
    const message = {
      from: this.from,
      to: email,
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

    return this.mailgunService
      .createEmail(this.domain, {
        ...message,
        template: this.template,
        'h:X-Mailgun-Variables': JSON.stringify({
          ...message,
          ...variables,
        }),
      })
      .catch((error: MailgunError) => {
        throw new InternalServerErrorException(error);
      });
  }

  /**
   * Отправляет письмо о смене пароля
   * @async
   * @param {string} email Почта
   * @param {string} forgotPasswordUrl URL по которому нужно пройти
   * @returns {any}
   */
  async forgotPassword(email: string, forgotPasswordUrl: string): Promise<any> {
    const message = {
      from: this.from,
      to: email,
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

    return this.mailgunService
      .createEmail(this.domain, {
        ...message,
        template: this.template,
        'h:X-Mailgun-Variables': JSON.stringify({
          ...message,
          ...variables,
        }),
      })
      .catch((error: MailgunError) => {
        throw new InternalServerErrorException(error);
      });
  }
}
