import { Injectable, Logger, Scope } from '@nestjs/common';

import { SpecificFormat } from '@/enums/specific-format.enum';
import { InvoiceEntity } from '@/database/invoice.entity';
import { MonitorEntity } from '@/database/monitor.entity';
import { UserEntity } from '@/database/user.entity';

import { viewsXls } from './views/xls';
import { viewsPdf } from './views/pdf';
import { deviceStatusXls } from './deviceStatus/xls';
import { deviceStatusPdf } from './deviceStatus/pdf';
import { invoiceXls } from './invoice/xls';
import { invoicePdf } from './invoice/pdf';

@Injectable({ scope: Scope.DEFAULT })
export class PrintService {
  logger = new Logger(PrintService.name);

  /**
   * Invoice
   *
   * @param user
   * @returns Buffer XLSX file buffer
   */
  async invoice(
    format: SpecificFormat,
    invoice: InvoiceEntity,
  ): Promise<Buffer> {
    switch (format) {
      case SpecificFormat.PDF:
        return invoicePdf({ invoice });

      case SpecificFormat.XLSX:
      default:
        return invoiceXls({ invoice });
    }
  }

  /**
   * Report on device status
   *
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async reportDeviceStatus({
    user,
    format,
    dateFrom,
    dateTo,
    monitors,
  }: {
    user: UserEntity;
    format: SpecificFormat;
    dateFrom: Date;
    dateTo: Date;
    monitors?: MonitorEntity[];
  }): Promise<Buffer> {
    switch (format) {
      case SpecificFormat.PDF:
        return deviceStatusPdf({
          user,
          monitors,
          dateFrom,
          dateTo,
        });

      case SpecificFormat.XLSX:
      default:
        return deviceStatusXls({
          user,
          monitors,
          dateFrom,
          dateTo,
        });
    }
  }

  /**
   * Report on views
   *
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async reportViews({
    user,
    monitors,
    format,
    dateFrom,
    dateTo,
  }: {
    user: UserEntity;
    monitors?: MonitorEntity[];
    format: SpecificFormat;
    dateFrom: Date;
    dateTo: Date;
  }): Promise<Buffer> {
    switch (format) {
      case SpecificFormat.PDF:
        return viewsPdf({ user, monitors, dateFrom, dateTo });

      case SpecificFormat.XLSX:
      default:
        return viewsXls({ user, monitors, dateFrom, dateTo });
    }
  }
}
