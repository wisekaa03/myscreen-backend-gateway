import type { Response as ExpressResponse } from 'express';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';
import { ClientProxy } from '@nestjs/microservices';

import { lastValueFrom } from 'rxjs';
import { MAIL_SERVICE, PrintInvoice } from '@/interfaces';
import { TypeOrmFind } from '@/utils/typeorm.find';
import { formatToContentType } from '@/utils/format-to-content-type';
import { SpecificFormat } from '@/enums/specific-format.enum';
import { InvoiceStatus } from '@/enums/invoice-status.enum';
import { InvoiceEntity } from './invoice.entity';
import { UserEntity } from './user.entity';
import { WalletService } from './wallet.service';
import { WalletEntity } from './wallet.entity';
import { UserService } from './user.service';
import { UserRoleEnum } from '@/enums';
import { ActService } from './act.service';

@Injectable()
export class InvoiceService {
  private logger = new Logger(InvoiceService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletService,
    private readonly actService: ActService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: ClientProxy,
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
  ) {}

  async find(
    find: FindManyOptions<InvoiceEntity>,
  ): Promise<[Array<InvoiceEntity>, number]> {
    return this.invoiceRepository.findAndCount(TypeOrmFind.Nullable(find));
  }

  async findOne(
    find: FindManyOptions<InvoiceEntity>,
  ): Promise<InvoiceEntity | null> {
    return this.invoiceRepository.findOne(TypeOrmFind.Nullable(find));
  }

  async create(
    user: UserEntity,
    sum: number,
    description?: string,
  ): Promise<InvoiceEntity | null> {
    return this.invoiceRepository.manager.transaction(async (transact) => {
      // Если у пользователя есть счет со статусом "Ожидает подтверждения",
      // "Подтвержден, ожидает оплаты", то нужно присвоить ему статус "Аннулирован".
      const invoices = await transact.find(InvoiceEntity, {
        where: [
          { userId: user.id, status: InvoiceStatus.AWAITING_CONFIRMATION },
          { userId: user.id, status: InvoiceStatus.CONFIRMED_PENDING_PAYMENT },
        ],
      });
      if (invoices.length > 0) {
        const invoicesPromise = Object.values(invoices).map((invoice) =>
          transact.save(InvoiceEntity, {
            ...invoice,
            status: InvoiceStatus.CANCELLED,
          }),
        );
        await Promise.all(invoicesPromise);
      }

      const invoiceChanged: DeepPartial<InvoiceEntity> = {
        sum,
        description,
        userId: user.id,
        status: InvoiceStatus.AWAITING_CONFIRMATION,
      };

      const { id } = await transact.save(
        InvoiceEntity,
        transact.create(InvoiceEntity, invoiceChanged),
      );

      return transact.findOne(InvoiceEntity, {
        where: { id },
        relations: ['user'],
      });
    });
  }

  async statusChange(
    invoice: InvoiceEntity,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity> {
    return this.invoiceRepository.manager.transaction(async (transact) => {
      const invoiceCreate = await transact.save(InvoiceEntity, {
        ...invoice,
        status,
      });

      switch (status) {
        // Если статус счета "Оплачен", то нужно записать в базу
        // сумму баланса и отправить письмо пользователю
        case InvoiceStatus.PAID: {
          // здесь записывается в базу сумма баланса
          await transact.save(
            WalletEntity,
            this.walletService.create({
              user: invoiceCreate.user,
              invoice: invoiceCreate,
            }),
          );

          const balance = await this.walletService.walletSum({
            userId: invoiceCreate.userId,
            transact,
          });

          // и выводится письмо о том, что счет оплачен
          this.mailService.emit('invoicePayed', {
            invoice: invoiceCreate,
            user: invoiceCreate.user,
            balance,
          });

          await this.walletService.acceptanceActCreate({
            user: invoiceCreate.user,
            transact,
          });

          break;
        }

        // Если статус счета "Ожидание подтверждения", то нужно отправить письма всем Бухгалтерам
        case InvoiceStatus.AWAITING_CONFIRMATION: {
          const accountantUsers = await this.userService.find({
            where: {
              role: UserRoleEnum.Accountant,
              disabled: false,
              verified: true,
            },
          });

          // Вызов сервиса отправки писем
          this.mailService.emit('invoiceAwaitingConfirmation', {
            accountantUsers,
            invoice: invoiceCreate,
          });

          break;
        }

        // Если статус счета "Подтвержден, ожидает оплаты", то нужно отправить письмо пользователю
        case InvoiceStatus.CONFIRMED_PENDING_PAYMENT: {
          this.mailService.emit('invoiceConfirmed', {
            user: invoiceCreate.user,
            invoice: invoiceCreate,
          });

          break;
        }

        default:
          break;
      }

      return Object.assign(invoiceCreate, { user: undefined });
    });
  }

  /**
   * Скачивание счета
   *
   * @param {ExpressResponse} res Ответ сервера
   * @param {SpecificFormat} format Формат вывода
   * @param {InvoiceEntity} invoice Счет
   * @return {*}  {Promise<void>}
   * @memberof InvoiceService
   */
  async download(
    res: ExpressResponse,
    format: SpecificFormat,
    invoice: InvoiceEntity,
  ): Promise<void> {
    if (!invoice.user) {
      throw new NotFoundException('Invoice: user not found');
    }

    const response = await lastValueFrom(
      this.mailService.send<Record<string, unknown>, PrintInvoice>('invoice', {
        format,
        invoice,
      }),
    );

    const specificFormat = formatToContentType[format]
      ? format
      : SpecificFormat.XLSX;

    const createdAt = dateFormat(
      invoice.createdAt || new Date(),
      "dd_LLLL_yyyy_'г._в'_hh_mm",
      {
        locale: dateRu,
      },
    );
    const invoiceFilename = encodeURI(
      `Счет_на_оплату_MyScreen_${createdAt}_на_сумму_${invoice.sum}₽.${specificFormat}`,
    );
    res.statusCode = 200;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoiceFilename}"`,
    );
    res.setHeader('Content-Type', formatToContentType[format]);

    res.end(response?.data, 'binary');
  }
}
