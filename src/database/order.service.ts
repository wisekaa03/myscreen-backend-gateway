import type { Response as ExpressResponse } from 'express';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindManyOptions, Repository } from 'typeorm';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { TypeOrmFind } from '../shared/typeorm.find';
import { OrderEntity } from './order.entity';
import { UserEntity } from './user.entity';
import { SpecificFormat } from '../enums/invoice-format.enum';
import { InvoiceApproved } from '../enums/invoice-approved.enum';
import { formatToContentType } from '../shared/format-to-content-type';
import { PrintService } from '../print/print.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly printService: PrintService,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
  ) {}

  async find(
    find: FindManyOptions<OrderEntity>,
  ): Promise<[Array<OrderEntity>, number]> {
    return this.orderRepository.findAndCount(TypeOrmFind.Nullable(find));
  }

  async findOne(
    find: FindManyOptions<OrderEntity>,
  ): Promise<OrderEntity | null> {
    return this.orderRepository.findOne(TypeOrmFind.Nullable(find));
  }

  async create(
    user: UserEntity,
    sum: number,
    description?: string,
  ): Promise<OrderEntity> {
    const order: DeepPartial<OrderEntity> = {
      sum,
      description,
      user,
      approved: InvoiceApproved.PENDING,
    };

    return this.orderRepository.save(this.orderRepository.create(order));
  }

  async approved(
    user: UserEntity,
    id: string,
    approved: InvoiceApproved,
  ): Promise<OrderEntity> {
    const order = await this.orderRepository.findOneBy({ id });
    if (!order) {
      throw new NotFoundException();
    }

    order.approved = approved;

    return this.orderRepository.save(order);
  }

  async download(
    user: UserEntity,
    res: ExpressResponse,
    id: string,
    format: SpecificFormat,
  ): Promise<void> {
    const invoice = await this.orderRepository.findOneBy({ id });
    if (!invoice) {
      throw new NotFoundException();
    }

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
