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

      //       const worksheet: CellObject[][] = [
      //         [
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Адрес: 119021, Россия, г. Москва, ул. Льва Толстого, д. 16',
      //             t: 's',
      //             s: { alignment: { horizontal: 'right' }, font: { bold: true } },
      //           },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'тел. (495) 739-70-00',
      //             t: 's',
      //             s: { font: { bold: true }, alignment: { horizontal: 'right' } },
      //           },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'факс. (495) 739-70-70',
      //             t: 's',
      //             s: { font: { bold: true }, alignment: { horizontal: 'right' } },
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Образец заполнения платежного поручения',
      //             t: 's',
      //             s: { font: { bold: true }, alignment: { horizontal: 'center' } },
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Получатель',
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
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Сч. №',
      //             t: 's',
      //             s: {
      //               alignment: { vertical: 'top' },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: '40702810600014307627',
      //             t: 's',
      //             s: {
      //               alignment: { vertical: 'top' },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: '',
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
      //           { v: '', t: 's' },
      //           {
      //             v: 'ИНН/КПП 7736207543/997750001 ООО "ЯНДЕКС"',
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
      //           { v: '', t: 's' },
      //           {
      //             v: 'Банк получателя',
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
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'БИК',
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
      //             v: '44525545',
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
      //             v: '',
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
      //           { v: '', t: 's' },
      //           {
      //             v: 'АО Юникредит Банк, 119034, г. Москва, Пречистенская наб., д. 9 ',
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
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Сч. №',
      //             t: 's',
      //             s: {
      //               alignment: { vertical: 'top' },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: '30101810300000000000000',
      //             t: 's',
      //             s: {
      //               alignment: { vertical: 'top' },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: '',
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
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Условия для расчетов',
      //             t: 's',
      //             s: { font: { bold: true, underline: true, italic: true } },
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '1. Счет действителен в течение пяти банковских дней.', t: 's' },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: '2. В назначении платежа, пожалуйста, указывайте номер счета.',
      //             t: 's',
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'СЧЕТ № Б-2438137758-1 от 27 февраля 2020 г.',
      //             t: 's',
      //             s: { font: { bold: true }, alignment: { horizontal: 'center' } },
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Заказчик: ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТОПАРТ"',
      //             t: 's',
      //             s: { alignment: { wrapText: true, vertical: 'top' } },
      //           },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Телефоны: 8(8553) 37-72-62',
      //             t: 's',
      //             s: { alignment: { wrapText: true, vertical: 'top' } },
      //           },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Представитель заказчика: Тухбатуллина Юлия Евгеньевна',
      //             t: 's',
      //             s: { alignment: { wrapText: true, vertical: 'top' } },
      //           },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Факс: 8(8553) 37-72-62',
      //             t: 's',
      //             s: { alignment: { wrapText: true, vertical: 'top' } },
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Основание:',
      //             t: 's',
      //             s: { font: { underline: true, bold: true, italic: true } },
      //           },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Оферта/Условия оказания услуг:',
      //             t: 's',
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: '№',
      //             t: 's',
      //             s: {
      //               alignment: { horizontal: 'center' },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           {
      //             v: 'Наименование товара, работы, услуги',
      //             t: 's',
      //             s: {
      //               alignment: { horizontal: 'center' },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Сумма, рубли РФ',
      //             t: 's',
      //             s: {
      //               alignment: { horizontal: 'center' },
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
      //           { v: '', t: 's' },
      //           {
      //             v: '1',
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
      //             v: 'Услуги «Яндекс.Директ».',
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
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: '5000',
      //             t: 'n',
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
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Итого без НДС:',
      //             t: 's',
      //             s: {
      //               alignment: { horizontal: 'right' },
      //             },
      //           },
      //           {
      //             v: 5000,
      //             t: 'n',
      //             s: {
      //               alignment: { horizontal: 'right' },
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
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'НДС:',
      //             t: 's',
      //             s: {
      //               alignment: { horizontal: 'right' },
      //             },
      //           },
      //           {
      //             v: '1000',
      //             t: 'n',
      //             s: {
      //               alignment: { horizontal: 'right' },
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
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           {
      //             v: 'Всего к оплате, рубли РФ:',
      //             t: 's',
      //             s: {
      //               alignment: { horizontal: 'right' },
      //               font: { bold: true },
      //             },
      //           },
      //           {
      //             v: '6000',
      //             t: 'n',
      //             s: {
      //               alignment: { horizontal: 'right' },
      //               font: { bold: true },
      //               border: {
      //                 top: { style: 'thin', color: { rgb: '000000' } },
      //                 bottom: { style: 'thin', color: { rgb: '000000' } },
      //                 right: { style: 'thin', color: { rgb: '000000' } },
      //                 left: { style: 'thin', color: { rgb: '000000' } },
      //               },
      //             },
      //           },
      //         ],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'К оплате: Шесть тысяч рублей 00 копеек',
      //             t: 's',
      //             s: { font: { bold: true } },
      //           },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { v: '', t: 's' },
      //           { l: { Target: 'https://ya.ru/yandex.png' }, t: 's' },
      //           { v: '(Л.Ф. Савков)', t: 's' },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           { v: 'Коммерческий директор', t: 's' },
      //         ],
      //         [
      //           { v: '', t: 's' },
      //           { v: 'По доверенности №95 от 15.06.2018', t: 's' },
      //         ],
      //         [],
      //         [],
      //         [],
      //         [],
      //         [
      //           { v: '', t: 's' },
      //           {
      //             v: 'Настоящий счет («Счет») выставлен в соответствии с Офертой на заключение договора возмездного оказания услуг (https://yandex.ru/legal/oferta_direct/ , https://yandex.ru/legal/directory_conditions/ , http://advertising.yandex.ru/price.xml , https://yandex.ru/legal/oferta_yandex_navy_ad/). Оплачивая настоящий Счет, Вы подтверждаете, что полностью и безоговорочно согласились с условиями Оферты и Договора, заключенного между Яндексом и Вами на условиях Оферты.',
      //             t: 's',
      //             s: { alignment: { wrapText: true, vertical: 'top' } },
      //           },
      //         ],
      //       ];
      //       const cols: ColInfo[] = [
      //         { wch: 5 },
      //         { wch: 5 },
      //         { wch: 19 },
      //         { wch: 11 },
      //         { wch: 15 },
      //         { wch: 11 },
      //         { wch: 11 },
      //         { wch: 16 },
      //       ];
      //       const rows: RowInfo[] = [
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         { hpx: 24 },
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         { hpx: 24 },
      //         { hpx: 24 },
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         {},
      //         { hpx: 72 },
      //       ];
      //       const merges: Range[] = [
      //         { s: { r: 4, c: 1 }, e: { r: 4, c: 7 } },
      //         { s: { r: 6, c: 1 }, e: { r: 6, c: 4 } },
      //         { s: { r: 6, c: 5 }, e: { r: 7, c: 5 } },
      //         { s: { r: 6, c: 6 }, e: { r: 7, c: 7 } },
      //         { s: { r: 7, c: 1 }, e: { r: 7, c: 4 } },
      //         { s: { r: 8, c: 1 }, e: { r: 8, c: 4 } },
      //         { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },
      //         { s: { r: 9, c: 1 }, e: { r: 9, c: 4 } },
      //         { s: { r: 9, c: 6 }, e: { r: 9, c: 7 } },
      //         { s: { r: 16, c: 1 }, e: { r: 16, c: 7 } },
      //         { s: { r: 18, c: 1 }, e: { r: 18, c: 4 } },
      //         { s: { r: 18, c: 5 }, e: { r: 18, c: 7 } },
      //         { s: { r: 19, c: 1 }, e: { r: 19, c: 4 } },
      //         { s: { r: 19, c: 5 }, e: { r: 19, c: 7 } },
      //         { s: { r: 24, c: 2 }, e: { r: 24, c: 6 } },
      //         { s: { r: 25, c: 2 }, e: { r: 25, c: 6 } },
      //         { s: { r: 38, c: 1 }, e: { r: 38, c: 7 } },
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
