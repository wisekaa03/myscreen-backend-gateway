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

@Injectable()
export class MailService {
  logger = new Logger(MailService.name);

  private template = 'user-action';

  private domain: string;

  private from: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly printService: PrintService,
    private readonly configService: ConfigService,
  ) {
    this.domain = configService.get<string>('MAIL_DOMAIN', 'localhost');
    this.from = `"MyScreen" <no-reply@${this.domain}>`;
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

  private static invoicePayedText = (invoiceSum: number, sum: number) =>
    `Спасибо за оплату. \n\
    Сумма счета: ${invoiceSum} рублей. \n\
    Баланс: ${sum} рублей. \n\
    \n`;

  /**
   * Отправляет приветственное письмо
   * @async
   * @param {string} email Почта пользователя
   * @returns {any}
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
   * @returns {any}
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
   * @returns {any}
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
   * @returns {any}
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
   * @returns {any}
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
      user,
      SpecificFormat.XLSX,
      invoice,
    );
    const message: ISendMailOptions = {
      to: user.email,
      from: this.from,
      subject: `Счет на оплату ${seqNo} от ${createdAtFormat} на сумму ${invoice.sum} рублей`,
      template: this.template,
      context: {
        text: MailService.invoiceConfirmedText(),
        attachment: [
          {
            filename: `Счет_на_оплату_${seqNo}_от_${createdAtFormatFile}.xlsx`,
            content: invoicePrint,
          },
        ],
      },
    };
    return this.mailerService.sendMail(message);
  }

  /**
   * Счёт оплачен
   * @async
   * @param {string} email Почта
   * @param {InvoiceEntity} invoice Счёт
   * @param {number} sum Баланс
   * @returns {any}
   */
  async invoicePayed(
    email: string,
    invoice: InvoiceEntity,
    sum: number,
  ): Promise<SentMessageInfo> {
    const { seqNo, createdAt } = invoice;
    const createdAtFormat = dateFormat(createdAt, 'dd LLLL yyyy г.', {
      locale: dateRu,
    });
    const message: ISendMailOptions = {
      to: email,
      from: this.from,
      subject: `Поступление по Счету ${seqNo} от ${createdAtFormat} на сумму ${invoice.sum} рублей`,
      template: this.template,
      context: {
        text: MailService.invoicePayedText(invoice.sum, sum ?? 0),
      },
    };
    return this.mailerService.sendMail(message);
  }
}
