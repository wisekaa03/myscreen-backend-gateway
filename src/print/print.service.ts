import {
  Injectable,
  InternalServerErrorException,
  Logger,
  Scope,
} from '@nestjs/common';
import XLSX from 'xlsx-js-style';
import { MonitorService } from '@/database/monitor.service';
import { InvoiceFormat } from '@/enums/invoice-format.enum';
import { printSpecific } from './print.specific';

@Injectable({ scope: Scope.DEFAULT })
export class PrintService {
  logger = new Logger(PrintService.name);

  constructor(private readonly monitorService: MonitorService) {}

  /**
   * Invoice
   *
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async invoice(userId: string, format: InvoiceFormat): Promise<Buffer> {
    const options: XLSX.WritingOptions = { bookType: 'xlsx', type: 'buffer' };
    const wb = XLSX.utils.book_new();
    const { worksheet, cols, rows, merges } = printSpecific.invoice.xls({});
    const ws = XLSX.utils.aoa_to_sheet(worksheet);
    ws['!cols'] = cols;
    ws['!rows'] = rows;
    ws['!merges'] = merges;
    XLSX.utils.book_append_sheet(wb, ws, 'Счёт');

    return XLSX.writeXLSX(wb, options);
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
    format: InvoiceFormat;
    dateFrom: Date;
    dateTo: Date;
    monitorId?: string;
  }): Promise<Buffer> {
    // const monitors = await this.monitorService.find(userId, {
    //   // TODO: fix this
    //   relations: [],
    // });

    const options: XLSX.WritingOptions = {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary',
    };
    const wb = XLSX.utils.book_new();
    const { worksheet, cols, rows, merges } = printSpecific.deviceStatus.xls({
      dateFrom,
      dateTo,
    });
    const ws = XLSX.utils.aoa_to_sheet(worksheet);
    ws['!cols'] = cols;
    ws['!rows'] = rows;
    ws['!merges'] = merges;
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по статусу устройства');

    return XLSX.writeXLSX(wb, options);
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
    format: InvoiceFormat;
    dateFrom: Date;
    dateTo: Date;
  }): Promise<Buffer> {
    const options: XLSX.WritingOptions = { bookType: 'xlsx', type: 'buffer' };
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const { worksheet, cols, rows, merges } = printSpecific.views.xls({
      dateFrom,
      dateTo,
    });
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheet);
    ws['!cols'] = cols;
    ws['!rows'] = rows;
    ws['!merges'] = merges;
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по показам');

    return XLSX.writeXLSX(wb, options);
  }
}
