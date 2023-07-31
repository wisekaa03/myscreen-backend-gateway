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

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(forwardRef(() => PrintService))
    private readonly printService: PrintService,
    @Inject(forwardRef(() => MailService))
    private readonly mailService: MailService,
    private readonly walletService: WalletService,
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
        this.invoiceRepository.save({
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

    return this.invoiceRepository.save(this.invoiceRepository.create(invoice));
  }

  async statusChange(
    user: UserEntity,
    invoice: InvoiceEntity,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity> {
    const newInvoice: InvoiceEntity = {
      ...invoice,
      status,
    };

    return this.invoiceRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const invoiceChanged = await transactionalEntityManager.save(
          InvoiceEntity,
          newInvoice,
        );

        if (status === InvoiceStatus.PAID) {
          // здесь записывается в базу сумма баланса
          await transactionalEntityManager.save(
            WalletEntity,
            this.walletService.create(user, invoiceChanged),
          );

          let sum = await this.walletService.walletSum(invoice.userId);
          // так как транакция не завершена, то приходится приплюсовывать сюда invoice.sum
          sum += invoice.sum;

          await this.mailService.invoicePayed(invoice.user.email, invoice, sum);
        } else if (status === InvoiceStatus.CONFIRMED_PENDING_PAYMENT) {
          await this.mailService.invoiceConfirmed(invoice.user, invoice);
        }

        return invoiceChanged;
      },
    );
  }

  async download(
    user: UserEntity,
    res: ExpressResponse,
    invoice: InvoiceEntity,
    format: SpecificFormat,
  ): Promise<void> {
    const data = await this.printService.invoice(user, format, invoice);

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
