import { Injectable, Logger, Scope } from '@nestjs/common';
import excelJS from 'exceljs';

import { SpecificFormat } from '../enums/specific-format.enum';
import { OrderEntity } from '../database/order.entity';
import { UserEntity } from '../database/user.entity';
import { MonitorService } from '../database/monitor.service';
import { UserService } from '../database/user.service';
import { printSpecific } from './print.specific';

@Injectable({ scope: Scope.DEFAULT })
export class PrintService {
  logger = new Logger(PrintService.name);

  constructor(
    private readonly monitorService: MonitorService,
    private readonly userService: UserService,
  ) {}

  /**
   * Invoice
   *
   * @param user
   * @returns Buffer XLSX file buffer
   */
  async invoice(
    user: UserEntity,
    format: SpecificFormat,
    invoice: OrderEntity,
  ): Promise<excelJS.Buffer> {
    switch (format) {
      case SpecificFormat.PDF:
        return printSpecific.invoice.pdf({ user, invoice });

      case SpecificFormat.XLSX:
      default:
        return printSpecific.invoice.xls({ user, invoice });
    }
  }

  /**
   * Report on device status
   *
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async reportDeviceStatus({
    userId,
    format,
    dateFrom,
    dateTo,
    monitorId,
  }: {
    userId: string;
    format: SpecificFormat;
    dateFrom: Date;
    dateTo: Date;
    monitorId?: string;
  }): Promise<excelJS.Buffer> {
    // const monitors = await this.monitorService.find(userId, {
    //   // TODO: fix this
    //   relations: [],
    // });

    switch (format) {
      case SpecificFormat.PDF:
        return printSpecific.deviceStatus.pdf({ dateFrom, dateTo });

      case SpecificFormat.XLSX:
      default:
        return printSpecific.deviceStatus.xls({ dateFrom, dateTo });
    }
  }

  /**
   * Report on views
   *
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async reportViews({
    userId,
    format,
    dateFrom,
    dateTo,
  }: {
    userId: string;
    format: SpecificFormat;
    dateFrom: Date;
    dateTo: Date;
  }): Promise<excelJS.Buffer> {
    switch (format) {
      case SpecificFormat.PDF:
        return printSpecific.views.pdf({ dateFrom, dateTo });

      case SpecificFormat.XLSX:
      default:
        return printSpecific.views.xls({ dateFrom, dateTo });
    }
  }
}
