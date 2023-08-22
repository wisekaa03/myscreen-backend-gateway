import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { SpecificFormat } from '@/enums';
import { InvoiceEntity } from '@/database/invoice.entity';
import { PrintService } from '@/print/print.service';
import { UserEntity } from '@/database/user.entity';
import { UserService } from '@/database/user.service';

@Injectable()
export class MailService {
  logger = new Logger(MailService.name);

  private template = 'user-action';

  private frontEndUrl: string;

  private domain: string;

  private from: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly printService: PrintService,
    private readonly configService: ConfigService,
  ) {
    this.frontEndUrl = configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    this.domain = configService.get('MAIL_DOMAIN', 'myscreen.ru');
    this.from = configService.get('MAIL_FROM', `no-reply@${this.domain}`);
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
    'Счет во вложении. \n\n\
    Напоминаем, что деньги на балансе отобразятся не сразу, а в течении нескольких дней с момента оплаты.';

  private static invoicePayedText = (invoiceSum: number, balance: number) =>
    `Спасибо за оплату. \n\
    Сумма счета: ${invoiceSum} руб. \n\
    Баланс: ${balance} руб. \n\
    \n`;

  private invoiceAwaitingConfirmationText = (
    invoiceSum: number,
    user: UserEntity,
  ) => `Пользователь ${UserService.fullName(user)} \
    (${user.company}) запросил(а) счет на оплату. \n\
    Пожалуйста, проверьте правильность сгенерированного файла, а после подтвердите \
    или отредактируйте его в панеле управления счетами: \n\
    ${this.frontEndUrl}/accountant/invoices \n\
    \n\
    Счет во вложении.`;

  private static balanceChangedText = (
    sum: number,
    balance: number,
  ) => `Списалась абонентская плата -${sum}.\n\
    Баланс: ${balance} руб. \n\
    `;

  private static balanceNotChangedText = (
    sum: number,
    balance: number,
  ) => `Внимание! \n\
    Недостаточно средств для списания абонентской платы (${sum} руб.)\n\
    Пополните баланс. Премиум подписка не доступна. \n\
    Баланс: ${balance} руб. \n\
    `;

  /**
   * Отправляет приветственное письмо
   * @async
   * @param {string} email Почта пользователя
   * @returns {SentMessageInfo}
   */
  async sendWelcomeMessage(email: string): Promise<SentMessageInfo> {
    const message: ISendMailOptions = {
      to: email,
      from: this.from,
      subject: 'Регистрация',
      template: this.template,
      context: {
        text: MailService.registerEmailText(),
      },
    };
    return this.mailerService.sendMail(message);
  }

  /**
   * Отправляет сообщение о поступившей заявке
   * @async
   * @param {string} email Почта пользователя
   * @returns {SentMessageInfo}
   */
  async sendApplicationWarningMessage(
    email: string,
    applicationUrl: string,
  ): Promise<SentMessageInfo> {
    const message: ISendMailOptions = {
      to: email,
      from: this.from,
      subject: 'Новая заявка',
      template: this.template,
      context: {
        text: MailService.applicationWarningText(applicationUrl),
        applicationUrl,
        button: {
          url: applicationUrl,
          text: 'Посмотреть',
        },
      },
    };
    return this.mailerService.sendMail(message);
  }

  /**
   * Отправляет письмо, подтверждающее пользователя
   * @async
   * @param {string} email Почта пользователя
   * @param {string} confirmUrl URL по которому нужно пройти
   * @returns {SentMessageInfo}
   */
  async sendVerificationCode(
    email: string,
    confirmUrl: string,
  ): Promise<SentMessageInfo> {
    const message: ISendMailOptions = {
      to: email,
      from: this.from,
      subject: 'Подтверждение аккаунта',
      template: this.template,
      context: {
        text: MailService.confirmEmailText(confirmUrl),
        confirmUrl,
        button: {
          url: confirmUrl,
          text: 'Подтвердить',
        },
      },
    };
    return this.mailerService.sendMail(message);
  }

  /**
   * Отправляет письмо о смене пароля
   * @async
   * @param {string} email Почта
   * @param {string} forgotPasswordUrl URL по которому нужно пройти
   * @returns {SentMessageInfo}
   */
  async forgotPassword(
    email: string,
    forgotPasswordUrl: string,
  ): Promise<SentMessageInfo> {
    const message: ISendMailOptions = {
      to: email,
      from: this.from,
      subject: 'Сброс пароля',
      template: this.template,
      context: {
        text: MailService.forgotPasswordText(forgotPasswordUrl),
        forgotPasswordUrl,
        button: {
          url: forgotPasswordUrl,
          text: 'Сбросить',
        },
      },
    };
    return this.mailerService.sendMail(message);
  }

  /**
   * Счёт подтвержден
   * @async
   * @param {UserEntity} user Почта
   * @param {InvoiceEntity} invoice Счёт
   * @returns {SentMessageInfo}
   */
  async invoiceConfirmed(
    user: UserEntity,
    invoice: InvoiceEntity,
  ): Promise<SentMessageInfo> {
    const { seqNo, createdAt } = invoice;
    const createdAtFormat = dateFormat(createdAt, 'dd LLLL yyyy г.', {
      locale: dateRu,
    });
    const createdAtFormatFile = dateFormat(createdAt, 'dd_LLLL_yyyy', {
      locale: dateRu,
    });
    const invoicePrint = await this.printService.invoice(
      SpecificFormat.XLSX,
      invoice,
    );
    const message: ISendMailOptions = {
      to: [{ name: UserService.fullName(user), address: user.email }],
      from: this.from,
      subject: `Счет на оплату №${seqNo} от ${createdAtFormat} на сумму ${invoice.sum} рублей`,
      template: this.template,
      context: {
        text: MailService.invoiceConfirmedText(),
      },
      attachments: [
        {
          filename: `Счет_на_оплату_${seqNo}_от_${createdAtFormatFile}.xlsx`,
          content: Buffer.from(invoicePrint),
        },
      ],
    };
    return this.mailerService.sendMail(message);
  }

  /**
   * Счёт оплачен
   * @async
   * @param {string} email Почта
   * @param {InvoiceEntity} invoice Счёт
   * @param {number} sum Баланс
   * @returns {SentMessageInfo}
   */
  async invoicePayed(
    user: UserEntity,
    invoice: InvoiceEntity,
    balance: number,
  ): Promise<SentMessageInfo> {
    const { seqNo, createdAt } = invoice;
    const createdAtFormat = dateFormat(createdAt, 'dd LLLL yyyy г.', {
      locale: dateRu,
    });
    const message: ISendMailOptions = {
      to: [{ name: UserService.fullName(user), address: user.email }],
      from: this.from,
      subject: `Поступление по Счету №${seqNo} от ${createdAtFormat} на сумму ${invoice.sum} рублей`,
      template: this.template,
      context: {
        text: MailService.invoicePayedText(invoice.sum, balance ?? 0),
      },
    };
    return this.mailerService.sendMail(message);
  }

  /**
   * После создания счета пользователем /invoice/create нужно
   * отправлять письмо бухгалтеру с этим счетом.
   * @async
   * @param {UserEntity[]} accountantUsers Пользователи бухгалтеры
   * @param {InvoiceEntity} invoice Счёт
   * @returns {SentMessageInfo}
   */
  async invoiceAwaitingConfirmation(
    accountantUsers: UserEntity[],
    invoice: InvoiceEntity,
  ): Promise<SentMessageInfo> {
    const { seqNo, createdAt } = invoice;
    const createdAtFormat = dateFormat(createdAt, 'dd LLLL yyyy г.', {
      locale: dateRu,
    });
    const createdAtFormatFile = dateFormat(createdAt, 'dd_LLLL_yyyy', {
      locale: dateRu,
    });
    const invoicePrint = await this.printService.invoice(
      SpecificFormat.XLSX,
      invoice,
    );
    const emails = accountantUsers.map((user) => ({
      name: UserService.fullName(user),
      address: user.email,
    }));
    const message: ISendMailOptions = {
      bcc: emails,
      from: this.from,
      subject: `Новый счет на оплату №${seqNo} от ${createdAtFormat} на сумму ${invoice.sum} рублей`,
      template: this.template,
      context: {
        text: this.invoiceAwaitingConfirmationText(invoice.sum, invoice.user),
      },
      attachments: [
        {
          filename: `Счет_на_оплату_${seqNo}_от_${createdAtFormatFile}.xlsx`,
          content: Buffer.from(invoicePrint),
        },
      ],
    };
    return this.mailerService.sendMail(message);
  }

  async balanceChanged(
    user: UserEntity,
    sum: number,
    balance: number,
  ): Promise<SentMessageInfo> {
    const message: ISendMailOptions = {
      to: [{ name: UserService.fullName(user), address: user.email }],
      from: this.from,
      subject: 'Изменение баланса',
      template: this.template,
      context: {
        text: MailService.balanceChangedText(sum, balance),
      },
    };

    return this.mailerService.sendMail(message);
  }

  async balanceNotChanged(
    user: UserEntity,
    sum: number,
    balance: number,
  ): Promise<SentMessageInfo> {
    const message: ISendMailOptions = {
      to: [{ name: UserService.fullName(user), address: user.email }],
      from: this.from,
      subject: 'Недостаточно средств!',
      template: this.template,
      context: {
        text: MailService.balanceNotChangedText(sum, balance),
      },
    };

    return this.mailerService.sendMail(message);
  }
}
