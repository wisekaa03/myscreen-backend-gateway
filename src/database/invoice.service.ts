import type { Response as ExpressResponse } from 'express';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { TypeOrmFind } from '../shared/typeorm.find';
import { InvoiceEntity } from './invoice.entity';
import { UserEntity } from './user.entity';
import { SpecificFormat } from '../enums/specific-format.enum';
import { InvoiceStatus } from '../enums/invoice-status.enum';
import { formatToContentType } from '../shared/format-to-content-type';
import { PrintService } from '../print/print.service';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly printService: PrintService,
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
          status: InvoiceStatus.CANCELLED,
        }),
      );
      await Promise.all(invoicesPromise);
    }

    const order: DeepPartial<InvoiceEntity> = {
      sum,
      description,
      user,
      status: InvoiceStatus.AWAITING_CONFIRMATION,
    };

    return this.invoiceRepository.save(this.invoiceRepository.create(order));
  }

  async statusChange(
    user: UserEntity,
    invoice: InvoiceEntity,
    status: InvoiceStatus,
  ): Promise<InvoiceEntity> {
    const newInvoice: DeepPartial<InvoiceEntity> = {
      ...invoice,
      status,
    };
    return this.invoiceRepository.save(newInvoice);
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
