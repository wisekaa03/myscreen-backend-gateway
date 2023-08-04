import type { Response as ExpressResponse } from 'express';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { TypeOrmFind } from '@/utils/typeorm.find';
import { formatToContentType } from '@/utils/format-to-content-type';
import { SpecificFormat } from '@/enums/specific-format.enum';
import { InvoiceStatus } from '@/enums/invoice-status.enum';
import { PrintService } from '@/print/print.service';
import { MailService } from '@/mail/mail.service';
import { InvoiceEntity } from './invoice.entity';
import { UserEntity } from './user.entity';
import { WalletService } from './wallet.service';
import { WalletEntity } from './wallet.entity';
import { UserService } from './user.service';
import { UserRoleEnum } from '@/enums';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(forwardRef(() => PrintService))
    private readonly printService: PrintService,
    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
    private readonly walletService: WalletService,
    private readonly userService: UserService,
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
  ): Promise<InvoiceEntity> {
    return this.invoiceRepository.manager.transaction(async (tManager) => {
      // Если у пользователя есть счет со статусом "Ожидает подтверждения",
      // "Подтвержден, ожидает оплаты", то нужно присвоить ему статус "Аннулирован".
      const invoices = await this.invoiceRepository.find({
        where: [
          { userId: user.id, status: InvoiceStatus.AWAITING_CONFIRMATION },
          { userId: user.id, status: InvoiceStatus.CONFIRMED_PENDING_PAYMENT },
        ],
      });
      if (invoices.length > 0) {
        const invoicesPromise = Object.values(invoices).map((invoice) =>
          tManager.save(InvoiceEntity, {
            ...invoice,
            user: undefined,
            status: InvoiceStatus.CANCELLED,
          }),
        );
        await Promise.all(invoicesPromise);
      }

      const invoice: DeepPartial<InvoiceEntity> = {
        sum,
        description,
        userId: user.id,
        status: InvoiceStatus.AWAITING_CONFIRMATION,
      };

      return tManager.save(
        InvoiceEntity,
        tManager.create(InvoiceEntity, invoice),
      );
    });
  }

  async statusChange(
    invoice: InvoiceEntity,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity> {
    const invoiceChanged: InvoiceEntity =
      await this.invoiceRepository.manager.transaction(async (tManager) => {
        const tInvoiceCreate = await tManager.save(InvoiceEntity, {
          ...invoice,
          status,
        });

        if (status === InvoiceStatus.PAID) {
          // здесь записывается в базу сумма баланса
          await tManager.save(
            WalletEntity,
            this.walletService.create({
              user: tInvoiceCreate.user,
              invoice: tInvoiceCreate,
            }),
          );

          const sum = await this.walletService.walletSum(
            tInvoiceCreate.userId,
            tManager,
          );

          await this.mailService.invoicePayed(
            tInvoiceCreate.user,
            tInvoiceCreate,
            sum,
          );
        } else if (status === InvoiceStatus.CONFIRMED_PENDING_PAYMENT) {
          await this.mailService.invoiceConfirmed(
            tInvoiceCreate.user,
            tInvoiceCreate,
          );
        } else if (status === InvoiceStatus.AWAITING_CONFIRMATION) {
          const accountantUsers = await this.userService.find({
            where: {
              role: UserRoleEnum.Accountant,
              disabled: false,
              verified: true,
            },
          });
          await this.mailService.invoiceAwaitingConfirmation(
            accountantUsers,
            tInvoiceCreate,
          );
        }

        return tInvoiceCreate;
      });

    return Object.assign(invoiceChanged, { user: undefined });
  }

  async download(
    res: ExpressResponse,
    format: SpecificFormat,
    invoice: InvoiceEntity,
  ): Promise<void> {
    const data = await this.printService.invoice(format, invoice);

    const specificFormat = formatToContentType[format]
      ? format
      : SpecificFormat.XLSX;

    const createdAt = dateFormat(
      invoice.createdAt,
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

    res.end(data, 'binary');
  }
}
