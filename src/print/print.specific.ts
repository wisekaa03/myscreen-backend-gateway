import excelJS from 'exceljs';

export interface PrintSpecific {
  xls(opt: Record<string, string | Date>): Promise<excelJS.Buffer>;

  pdf(opt: Record<string, string | Date>): Promise<excelJS.Buffer>;
}

export const printSpecific: Record<string, PrintSpecific> = {
  invoice: {
    xls: async ({ dateFrom, dateTo }) => {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Счёт');

      const rows = [
        [
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'Адрес: 119021, Россия, г. Москва, ул. Льва Толстого, д. 16',
        ],
        ['', '', '', '', '', '', '', 'тел. (495) 739-70-00'],
        ['', '', '', '', '', '', '', 'факс. (495) 739-70-70'],
        [],
        ['', 'Образец заполнения платежного поручения'],
        [],
        ['', 'Получатель', '', '', '', 'Сч. №', '40702810600014307627'],
        ['', 'ИНН/КПП 7736207543/997750001 ООО "ЯНДЕКС"'],
        ['', 'Банк получателя', '', '', '', 'БИК', '44525545'],
        [
          '',
          'АО Юникредит Банк, 119034, г. Москва, Пречистенская наб., д. 9 ',
          '',
          '',
          '',
          'Сч. №',
          '30101810300000000000000',
        ],
        [],
        ['', 'Условия для расчетов'],
        [],
        ['', '', '1. Счет действителен в течение пяти банковских дней.'],
        [
          '',
          '',
          '2. В назначении платежа, пожалуйста, указывайте номер счета.',
        ],
        [],
        ['', 'СЧЕТ № Б-2438137758-1 от 27 февраля 2020 г.'],
        [],
        [
          '',
          'Заказчик: ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТОПАРТ"',
          '',
          '',
          '',
          'Телефоны: 8(8553) 37-72-62',
        ],
        [
          '',
          'Представитель заказчика: Тухбатуллина Юлия Евгеньевна',
          '',
          '',
          '',
          'Факс: 8(8553) 37-72-62',
        ],
        [],
        ['', 'Основание:'],
        ['', 'Оферта/Условия оказания услуг'],
        [],
        [
          '',
          '№',
          'Наименование товара, работы, услуги',
          '',
          '',
          '',
          '',
          'Сумма, рубли РФ',
        ],
        ['', '1', 'Услуги «Яндекс.Директ».', '', '', '', '', 5000],
        ['', '', '', '', '', '', 'Итого без НДС:', 5000],
        ['', '', '', '', '', '', 'НДС:', 1000],
        ['', '', '', '', '', '', 'Всего к оплате, рубли РФ:', 6000],
        [],
        ['', 'К оплате: Шесть тысяч рублей 00 копеек'],
        ['', '', '', '', '(Л.Ф. Савков)'],
        ['', 'Коммерческий директор'],
        ['', 'По доверенности №95 от 15.06.2018'],
        [],
        [],
        [],
        [],
        [
          '',
          'Настоящий счет («Счет») выставлен в соответствии с Офертой на заключение договора возмездного оказания услуг (https://yandex.ru/legal/oferta_direct/ , https://yandex.ru/legal/directory_conditions/ , http://advertising.yandex.ru/price.xml , https://yandex.ru/legal/oferta_yandex_navy_ad/). Оплачивая настоящий Счет, Вы подтверждаете, что полностью и безоговорочно согласились с условиями Оферты и Договора, заключенного между Яндексом и Вами на условиях Оферты.',
        ],
      ];
      worksheet.addRows(rows);
      worksheet.pageSetup.scale = 70;
      worksheet.columns = [
        {
          width: 8,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
        {
          width: 8,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
        {
          width: 24,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
        {
          width: 15,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
        {
          width: 22,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
        {
          width: 12,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
        {
          width: 15,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
        {
          width: 24,
          style: {
            font: { name: 'Arial', size: 14 },
            alignment: { vertical: 'top' },
          },
        },
      ];
      worksheet.getRow(10).height = 24;
      worksheet.getRow(10).height = 36;
      worksheet.getRow(19).height = 36;
      worksheet.getRow(20).height = 36;
      worksheet.getRow(39).height = 110;
      worksheet.getCell('H1').style = {
        font: { name: 'Arial', size: 14, bold: true },
        alignment: { horizontal: 'right' },
      };
      worksheet.getCell('H2').style = {
        font: { name: 'Arial', size: 14, bold: true },
        alignment: { horizontal: 'right' },
      };
      worksheet.getCell('H3').style = {
        font: { name: 'Arial', size: 14, bold: true },
        alignment: { horizontal: 'right' },
      };
      worksheet.getCell('B5').style = {
        font: { name: 'Arial', size: 14, bold: true },
        alignment: { horizontal: 'center' },
      };
      worksheet.getCell('B7').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('B8').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('B9').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('B10').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('F7').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('F9').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('F10').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('G7').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('G9').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('G10').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        },
      };
      worksheet.getCell('B12').style = {
        font: {
          name: 'Arial',
          size: 14,
          bold: true,
          underline: true,
          italic: true,
        },
      };
      worksheet.getCell('B17').style = {
        font: {
          name: 'Arial',
          size: 14,
          bold: true,
        },
        alignment: { horizontal: 'center' },
      };
      worksheet.getCell('B22').style = {
        font: {
          name: 'Arial',
          size: 14,
          bold: true,
          italic: true,
          underline: true,
        },
      };
      worksheet.getCell('C25').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'center' },
      };
      worksheet.getCell('H25').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'center' },
      };
      worksheet.getCell('G27').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'right' },
      };
      worksheet.getCell('G28').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { horizontal: 'right' },
      };
      worksheet.getCell('G29').style = {
        font: { name: 'Arial', size: 14, bold: true },
        alignment: { horizontal: 'right' },
      };
      worksheet.getCell('B31').style = {
        font: { name: 'Arial', size: 14, bold: true, italic: true },
      };
      worksheet.getCell('B39').style = {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'top', wrapText: true },
      };

      worksheet.mergeCells('B5:H5');
      worksheet.mergeCells('B7:E7');
      worksheet.mergeCells('F7:F8');
      worksheet.mergeCells('G7:H8');
      worksheet.mergeCells('B8:E8');
      worksheet.mergeCells('B9:E9');
      worksheet.mergeCells('G9:H9');
      worksheet.mergeCells('B10:E10');
      worksheet.mergeCells('G10:H10');
      worksheet.mergeCells('B17:H17');
      worksheet.mergeCells('C25:G25');
      worksheet.mergeCells('C26:G26');
      worksheet.mergeCells('B39:H39');

      return workbook.xlsx.writeBuffer();
    },

    pdf: async ({ dateFrom, dateTo }) => {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Счёт');

      return workbook.xlsx.writeBuffer();
    },
  },

  deviceStatus: {
    xls: async ({ dateFrom, dateTo }) => {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Счёт');

      //       const worksheet: CellObject[][] = [
      //         [
      //           {
      //             v: 'Отчет по статусам устройств',
      //             t: 's',
      //           },
      //         ],
      //         [
      //           {
      //             v: `Период отчета: с ${dateFrom} по ${dateTo}`,
      //             t: 's',
      //           },
      //         ],
      //         [{ t: 'z' }],
      //         [{ t: 'z' }],
      //         [
      //           {
      //             v: 'Название устройства',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           { t: 'z' },
      //           { t: 'z' },
      //           {
      //             v: 'Название папки',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           { t: 'z' },
      //           {
      //             v: 'Адрес',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           { t: 'z' },
      //           {
      //             t: 'z',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //         ],
      //         [
      //           {
      //             v: 'Samsung',
      //             t: 's',
      //             s: {
      //               alignment: { wrapText: true },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           { t: 'z' },
      //           { t: 'z' },
      //           {
      //             v: 'АЗС-123',
      //             t: 's',
      //             s: {
      //               alignment: { wrapText: true },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           { t: 'z' },
      //           {
      //             v: 'Челябинская область, Сосновский район, 35 км а/д Челябинск-Троицк',
      //             t: 's',
      //             s: {
      //               alignment: { wrapText: true },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //         ],
      //         [{ t: 'z' }],
      //         [
      //           { t: 'z' },
      //           {
      //             v: 'Статус',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: 'Дата начала',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: 'Дата окончания',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: 'Продолжительность',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           { t: 'z' },
      //           {
      //             v: 'Описание ошибки',
      //             t: 's',
      //             s: {
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //         ],
      //         [
      //           { t: 'z' },
      //           { v: 'online', t: 's', s: {} },
      //           {
      //             v: '23.04.2021 18:29:43',
      //             t: 's',
      //             s: {},
      //           },
      //           {
      //             v: '24.04.2021 10:44:27',
      //             t: 's',
      //             s: {},
      //           },
      //           {
      //             v: '16 часов 14 минут 44 секунды',
      //             t: 's',
      //             s: {},
      //           },
      //           { t: 'z' },
      //         ],
      //         [
      //           { t: 'z' },
      //           { v: 'offline', t: 's', s: {} },
      //           {
      //             v: '24.04.2021 10:44:27',
      //             t: 's',
      //             s: {},
      //           },
      //           {
      //             v: '24.04.2021 10:44:32',
      //             t: 's',
      //             s: {},
      //           },
      //           { v: '5 секунд', t: 's', s: {} },
      //         ],
      //       ];
      //       const cols: ColInfo[] = [
      //         { wch: 1 },
      //         { wch: 10 },
      //         { wch: 19 },
      //         { wch: 19 },
      //         { wch: 11 },
      //         { wch: 30 },
      //         { wch: 30 },
      //         { wch: 30 },
      //       ];
      //       const rows: RowInfo[] = [];
      //       const merges: Range[] = [
      //         { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
      //         { s: { r: 4, c: 3 }, e: { r: 4, c: 4 } },
      //         { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },
      //         { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
      //         { s: { r: 5, c: 3 }, e: { r: 5, c: 4 } },
      //         { s: { r: 5, c: 5 }, e: { r: 5, c: 7 } },
      //         { s: { r: 7, c: 4 }, e: { r: 7, c: 5 } },
      //         { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } },
      //         { s: { r: 8, c: 4 }, e: { r: 8, c: 5 } },
      //         { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },
      //         { s: { r: 9, c: 4 }, e: { r: 9, c: 5 } },
      //         { s: { r: 9, c: 6 }, e: { r: 9, c: 7 } },
      //       ];
      //       return { worksheet, cols, rows, merges };

      return workbook.xlsx.writeBuffer();
    },

    pdf: async ({ dateFrom, dateTo }) => {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Счёт');

      return workbook.xlsx.writeBuffer();
    },
  },

  views: {
    xls: async ({ dateFrom, dateTo }) => {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Отчет по статусам устройств');

      worksheet.addRow(['Отчёт по показам']);

      return workbook.xlsx.writeBuffer();
    },

    pdf: async ({ dateFrom, dateTo }) => {
      const workbook = new excelJS.Workbook();
      const worksheet = workbook.addWorksheet('Отчёт по показам');

      worksheet.addRow(['Отчёт по показам']);

      return workbook.xlsx.writeBuffer();
    },
  },
};
