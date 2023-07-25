import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MailgunMessageData,
  MailgunService,
  type MailgunError,
} from 'nestjs-mailgun';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { InvoiceEntity } from '../database/invoice.entity';
import { PrintService } from '@/print/print.service';
import { UserEntity } from '@/database/user.entity';
import { SpecificFormat } from '@/enums';

@Injectable()
export class MailService {
  logger = new Logger(MailService.name);

  private template = 'template.user-action';

  private domain: string;

  private from: string;

  constructor(
    private readonly mailgunService: MailgunService,
    private readonly printService: PrintService,
    private readonly configService: ConfigService,
  ) {
    this.domain = configService.get<string>('MAILGUN_API_DOMAIN', 'localhost');
    this.from = `MyScreen <no-reply@${this.domain}>`;
  }

  private static confirmEmailText = (confirmUrl: string) =>
    `Вы указали эту почту при регистрации на MyScreen. \n\
    Для подтверждения электронной почты и завершения процесса \n\
    регистрации, пройдите, пожалуйста, по ссылке: \n\
    ${confirmUrl}`;

  private static forgotPasswordText = (forgotPasswordUrl: string) =>
    `Чтобы восстановить доступ к своему аккаунту, пройдите, пожалуйста, по ссылке: \n\
    ${forgotPasswordUrl}`;

  private static registerEmailText = () =>
    'Добро пожаловать в MySсreen. \n\
    Поздравляем с успешной регистрацией. \n\
    Мы рады видеть Вас в числе наших пользователей.';

  private static applicationWarningText = (applicationUrl: string) =>
    `Вы получили новую заявку в MyScreen! \n\
    Чтобы с ней ознакомиться, пройдите, пожалуйста, по ссылке: \n\
    ${applicationUrl}`;

  private static invoiceConfirmedText = () =>
    'Счет во вложении. \n\
    Напоминаем, что деньги на балансе отобразятся не сразу, а в течении нескольких дней с момента оплаты.';

  private static invoicePayedText = (sum: number) =>
    `Спасибо за оплату. \n\
    Баланс: ${sum} рублей\n\
    \n`;

  /**
   * Отправляет приветственное письмо
   * @async
   * @param {string} email Почта пользователя
   * @returns {any}
   */
  async sendWelcomeMessage(email: string): Promise<any> {
    const message: MailgunMessageData = {
      from: this.from,
      to: email,
      subject: 'Регистрация',
      text: MailService.registerEmailText(),
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
   * Отправляет сообщение о поступившей заявке
   * @async
   * @param {string} email Почта пользователя
   * @returns {any}
   */
  async sendApplicationWarningMessage(
    email: string,
    applicationUrl: string,
  ): Promise<any> {
    const message: MailgunMessageData = {
      from: this.from,
      to: email,
      subject: 'Новая заявка',
      text: MailService.applicationWarningText(applicationUrl),
    };

    const variables = {
      applicationUrl,
      button: {
        url: applicationUrl,
        text: 'Посмотреть',
      },
    };

    return this.mailgunService
      .createEmail(this.domain, {
        ...message,
        template: this.template,
        'h:X-Mailgun-Variables': JSON.stringify({ ...message, ...variables }),
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
    const message: MailgunMessageData = {
      from: this.from,
      to: email,
      subject: 'Подтверждение аккаунта',
      text: MailService.confirmEmailText(confirmUrl),
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
    const message: MailgunMessageData = {
      from: this.from,
      to: email,
      subject: 'Сброс пароля',
      text: MailService.forgotPasswordText(forgotPasswordUrl),
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

  /**
   * Счёт подтвержден
   * @async
   * @param {string} email Почта
   * @param {InvoiceEntity} invoice Счёт
   * @returns {any}
   */
  async invoiceConfirmed(
    user: UserEntity,
    invoice: InvoiceEntity,
  ): Promise<any> {
    const { seqNo, createdAt } = invoice;

    const createdAtFormat = dateFormat(createdAt, 'dd LLLL yyyy г.', {
      locale: dateRu,
    });

    const createdAtFormatFile = dateFormat(createdAt, 'dd_LLLL_yyyy', {
      locale: dateRu,
    });

    const invoicePrint = await this.printService.invoice(
      user,
      SpecificFormat.XLSX,
      invoice,
    );

    const text = MailService.invoiceConfirmedText();
    const message: MailgunMessageData = {
      from: this.from,
      to: user.email,
      subject: `Счет на оплату ${seqNo} от ${createdAtFormat} на сумму ${invoice.sum} рублей`,
      text,
      attachment: [
        {
          filename: `Счет_на_оплату_${seqNo}_от_${createdAtFormatFile}.xlsx`,
          data: invoicePrint,
        },
      ],
    };

    const variables = {
      text,
    };

    return this.mailgunService
      .createEmail(this.domain, {
        ...message,
        template: this.template,
        'h:X-Mailgun-Variables': JSON.stringify({
          ...variables,
        }),
      })
      .catch((error: MailgunError) => {
        throw new InternalServerErrorException(error);
      });
  }

  /**
   * Счёт оплачен
   * @async
   * @param {string} email Почта
   * @param {InvoiceEntity} invoice Счёт
   * @returns {any}
   */
  async invoicePayed(
    email: string,
    invoice: InvoiceEntity,
    sum: number,
  ): Promise<any> {
    const { seqNo, createdAt } = invoice;

    const createdAtFormat = dateFormat(createdAt, 'dd LLLL yyyy г.', {
      locale: dateRu,
    });

    const text = MailService.invoicePayedText(sum ?? 0);
    const message: MailgunMessageData = {
      from: this.from,
      to: email,
      subject: `Поступление по Счету ${seqNo} от ${createdAtFormat} на сумму ${invoice.sum} рублей`,
      text,
    };

    const variables = {
      text,
    };
    return this.mailgunService
      .createEmail(this.domain, {
        ...message,
        template: this.template,
        'h:X-Mailgun-Variables': JSON.stringify({
          ...variables,
        }),
      })
      .catch((error: MailgunError) => {
        throw new InternalServerErrorException(error);
      });
  }
}
