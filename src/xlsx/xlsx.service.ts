import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import xlsx from 'node-xlsx';

@Injectable()
export class XlsxService {
  logger = new Logger(XlsxService.name);

  /**
   * Invoice
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async invoice(userId: string): Promise<Buffer> {
    const data: any = [];
    const options: any = {};

    return xlsx.build([
      {
        name: 'Счёт',
        data,
        options,
      },
    ]);
  }

  /**
   * Report on device status
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async reportDeviceStatus({
    userId,
    dateFrom,
    dateTo,
  }: {
    userId: string;
    dateFrom: Date;
    dateTo: Date;
  }): Promise<Buffer> {
    const data: any = [];
    const options: any = {};

    return xlsx.build([
      {
        name: 'Отчёт по статусу устройства',
        data,
        options,
      },
    ]);
  }

  /**
   * Report on views
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async reportViews({
    userId,
    dateFrom,
    dateTo,
  }: {
    userId: string;
    dateFrom: Date;
    dateTo: Date;
  }): Promise<Buffer> {
    const data: any = [];
    const options: any = {};

    return xlsx.build([
      {
        name: 'Отчёт по показам',
        data,
        options,
      },
    ]);
  }
}
