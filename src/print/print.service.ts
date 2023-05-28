import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import XLSX from 'xlsx-js-style';
import { CellObject } from 'xlsx-js-style/types';
import { MonitorService } from '@/database/monitor.service';
import { InvoiceFormat } from '@/enums/invoice-format.enum';

@Injectable()
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
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet<CellObject>([
      [
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Адрес: 119021, Россия, г. Москва, ул. Льва Толстого, д. 16',
          t: 's',
          s: { alignment: { horizontal: 'right' }, font: { bold: true } },
        },
      ],
      [
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'тел. (495) 739-70-00',
          t: 's',
          s: { font: { bold: true }, alignment: { horizontal: 'right' } },
        },
      ],
      [
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'факс. (495) 739-70-70',
          t: 's',
          s: { font: { bold: true }, alignment: { horizontal: 'right' } },
        },
      ],
      [],
      [
        { v: '', t: 's' },
        {
          v: 'Образец заполнения платежного поручения',
          t: 's',
          s: { font: { bold: true }, alignment: { horizontal: 'center' } },
        },
      ],
      [],
      [
        { v: '', t: 's' },
        { v: 'Получатель', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: 'Сч. №', t: 's', s: { alignment: { vertical: 'top' } } },
        {
          v: '40702810600014307627',
          t: 's',
          s: { alignment: { vertical: 'top' } },
        },
      ],
      [
        { v: '', t: 's' },
        { v: 'ИНН/КПП 7736207543/997750001 ООО "ЯНДЕКС"', t: 's' },
      ],
      [
        { v: '', t: 's' },
        { v: 'Банк получателя', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: 'БИК', t: 's' },
        { v: '44525545', t: 's' },
      ],
      [
        { v: '', t: 's' },
        {
          v: 'АО Юникредит Банк, 119034, г. Москва, Пречистенская наб., д. 9 ',
          t: 's',
          s: { alignment: { wrapText: true } },
        },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: 'Сч. №', t: 's', s: { alignment: { vertical: 'top' } } },
        {
          v: '30101810300000000000000',
          t: 's',
          s: { alignment: { vertical: 'top' } },
        },
      ],
      [],
      [
        { v: '', t: 's' },
        {
          v: 'Условия для расчетов',
          t: 's',
          s: { font: { bold: true, underline: true } },
        },
      ],
      [],
      [
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '1. Счет действителен в течение пяти банковских дней.', t: 's' },
      ],
      [
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: '2. В назначении платежа, пожалуйста, указывайте номер счета.',
          t: 's',
        },
      ],
      [],
      [
        { v: '', t: 's' },
        {
          v: 'СЧЕТ № Б-2438137758-1 от 27 февраля 2020 г.',
          t: 's',
          s: { font: { bold: true }, alignment: { horizontal: 'center' } },
        },
      ],
      [],
    ]);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 5 },
      { wch: 19 },
      { wch: 11 },
      { wch: 15 },
      { wch: 11 },
      { wch: 11 },
      { wch: 15 },
    ];
    ws['!rows'] = [{}, {}, {}, {}, {}, {}, {}, {}, {}, { hpx: 24 }];
    ws['!merges'] = [
      { s: { r: 4, c: 1 }, e: { r: 4, c: 7 } },

      { s: { r: 6, c: 1 }, e: { r: 6, c: 4 } },
      { s: { r: 6, c: 5 }, e: { r: 7, c: 5 } },
      { s: { r: 6, c: 6 }, e: { r: 7, c: 7 } },

      { s: { r: 7, c: 1 }, e: { r: 7, c: 4 } },

      { s: { r: 8, c: 1 }, e: { r: 8, c: 4 } },
      { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },

      { s: { r: 9, c: 1 }, e: { r: 9, c: 4 } },
      { s: { r: 9, c: 6 }, e: { r: 9, c: 7 } },

      { s: { r: 16, c: 1 }, e: { r: 16, c: 7 } },
    ];
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
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet<CellObject>([
      [
        {
          v: 'Отчет по статусам устройств',
          t: 's',
        },
      ],
      [
        {
          v: `Период отчета: с ${dateFrom} по ${dateTo}`,
          t: 's',
        },
      ],
      [{ t: 'z' }],
      [{ t: 'z' }],
      [
        {
          v: 'Название устройства',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        { t: 'z' },
        { t: 'z' },
        {
          v: 'Название папки',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        { t: 'z' },
        {
          v: 'Адрес',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        { t: 'z' },
        {
          t: 'z',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
      ],
      [
        {
          v: 'Samsung',
          t: 's',
          s: {
            alignment: { wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        { t: 'z' },
        { t: 'z' },
        {
          v: 'АЗС-123',
          t: 's',
          s: {
            alignment: { wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        { t: 'z' },
        {
          v: 'Челябинская область, Сосновский район, 35 км а/д Челябинск-Троицк',
          t: 's',
          s: {
            alignment: { wrapText: true },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
      ],
      [{ t: 'z' }],
      [
        { t: 'z' },
        {
          v: 'Статус',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: 'Дата начала',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: 'Дата окончания',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: 'Продолжительность',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        { t: 'z' },
        {
          v: 'Описание ошибки',
          t: 's',
          s: {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
      ],
      [
        { t: 'z' },
        { v: 'online', t: 's', s: {} },
        {
          v: '23.04.2021 18:29:43',
          t: 's',
          s: {},
        },
        {
          v: '24.04.2021 10:44:27',
          t: 's',
          s: {},
        },
        {
          v: '16 часов 14 минут 44 секунды',
          t: 's',
          s: {},
        },
        { t: 'z' },
      ],
      [
        { t: 'z' },
        { v: 'offline', t: 's', s: {} },
        {
          v: '24.04.2021 10:44:27',
          t: 's',
          s: {},
        },
        {
          v: '24.04.2021 10:44:32',
          t: 's',
          s: {},
        },
        { v: '5 секунд', t: 's', s: {} },
      ],
    ]);
    ws['!cols'] = [
      { wch: 1 },
      { wch: 10 },
      { wch: 19 },
      { wch: 19 },
      { wch: 11 },
      { wch: 30 },
      { wch: 30 },
      { wch: 30 },
    ];
    ws['!merges'] = [
      { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
      { s: { r: 4, c: 3 }, e: { r: 4, c: 4 } },
      { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },

      { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
      { s: { r: 5, c: 3 }, e: { r: 5, c: 4 } },
      { s: { r: 5, c: 5 }, e: { r: 5, c: 7 } },

      { s: { r: 7, c: 4 }, e: { r: 7, c: 5 } },
      { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } },

      { s: { r: 8, c: 4 }, e: { r: 8, c: 5 } },
      { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },

      { s: { r: 9, c: 4 }, e: { r: 9, c: 5 } },
      { s: { r: 9, c: 6 }, e: { r: 9, c: 7 } },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по статусу устройства');

    return XLSX.write(wb, options);
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
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
      [{ v: 'Отчёт по показам' }],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Отчёт по показам');

    return XLSX.writeXLSX(wb, options);
  }
}
