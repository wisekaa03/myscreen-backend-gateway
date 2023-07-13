import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import excelJS from 'exceljs';
import { MonitorService } from '@/database/monitor.service';
import { SpecificFormat } from '@/enums/invoice-format.enum';
import { printSpecific } from './print.specific';
import { UserService } from '@/database/user.service';

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
   * @param userId
   * @returns Buffer XLSX file buffer
   */
  async invoice(
    userId: string,
    format: SpecificFormat,
    sum: number,
  ): Promise<excelJS.Buffer> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    switch (format) {
      case SpecificFormat.PDF:
        return printSpecific.invoice.pdf({ user, sum });

      case SpecificFormat.XLSX:
      default:
        return printSpecific.invoice.xls({ user, sum });
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
