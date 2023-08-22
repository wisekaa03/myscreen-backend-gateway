import excelJS from 'exceljs';
import { format } from '@vicimpa/rubles';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { numberFormat, vat } from '@/print/print.utils';
import { InvoiceEntity } from '@/database/invoice.entity';

export const invoiceXls = async ({ invoice }: { invoice: InvoiceEntity }) => {
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet('Счёт');

  const { sum, seqNo, createdAt } = invoice;
  const createdAtFormat = dateFormat(createdAt, 'dd LLLL yyyy г.', {
    locale: dateRu,
  });
  const withoutVat = numberFormat(sum - vat(sum));
  const vatSum = numberFormat(vat(sum));
  const wordsSum = format(sum);

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
    ['', '', '2. В назначении платежа, пожалуйста, указывайте номер счета.'],
    [],
    ['', `СЧЕТ № ${seqNo} от ${createdAtFormat}`],
    [],
    [
      '',
      `Заказчик: ${invoice.user.company}`,
      '',
      '',
      '',
      `Телефоны: ${invoice.user.companyPhone}`,
    ],
    [
      '',
      `Представитель заказчика: ${invoice.user.companyRepresentative}`,
      '',
      '',
      '',
      `Факс: ${invoice.user.companyFax}`,
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
    ['', '1', 'Услуги «Яндекс.Директ».', '', '', '', '', withoutVat],
    ['', '', '', '', '', '', 'Итого без НДС:', withoutVat],
    ['', '', '', '', '', '', 'НДС:', vatSum],
    ['', '', '', '', '', '', 'Всего к оплате, рубли РФ:', numberFormat(sum)],
    [],
    ['', `К оплате: ${wordsSum}`],
    [],
    ['', 'Коммерческий директор'],
    ['', 'По доверенности №95 от 15.06.2018', '', '', '(Л.Ф. Савков)'],
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
  worksheet.columns = [
    {
      width: 8,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 8,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 28,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 16,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 22,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 12,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 15,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 24,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 4,
      style: {
        font: { name: 'Arial', size: 14 },
        alignment: { vertical: 'middle' },
      },
    },
  ];
  worksheet.getRow(10).height = 24;
  worksheet.getRow(10).height = 36;
  worksheet.getRow(19).height = 36;
  worksheet.getRow(20).height = 36;
  worksheet.getRow(34).height = 36;
  worksheet.getRow(38).height = 48;
  worksheet.getRow(39).height = 110;

  worksheet.getCell('H1').style = {
    font: {
      name: 'Arial',
      size: 14,
      bold: true,
    },
    alignment: { horizontal: 'right' },
  };
  worksheet.getCell('H2').style = {
    font: {
      name: 'Arial',
      size: 14,
      bold: true,
    },
    alignment: { horizontal: 'right' },
  };
  worksheet.getCell('H3').style = {
    font: {
      name: 'Arial',
      size: 14,
      bold: true,
    },
    alignment: { horizontal: 'right' },
  };

  worksheet.getCell('B5').style = {
    font: { name: 'Arial', size: 14, bold: true },
    alignment: { horizontal: 'center' },
  };
  worksheet.getCell('B7').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('B8').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('B9').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('B10').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('F7').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('F9').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('F10').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('G7').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('G9').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('G10').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'left', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('B12').style.font = {
    name: 'Arial',
    size: 14,
    bold: true,
    underline: true,
    italic: true,
  };
  worksheet.getCell('B17').style = {
    alignment: { horizontal: 'center' },
    font: {
      name: 'Arial',
      size: 14,
      bold: true,
    },
  };
  worksheet.getCell('B19').style = {
    font: {
      name: 'Arial',
      size: 14,
    },
    alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
  };
  worksheet.getCell('B20').style = {
    font: {
      name: 'Arial',
      size: 14,
    },
    alignment: { vertical: 'top', horizontal: 'left', wrapText: true },
  };
  worksheet.getCell('B22').style.font = {
    name: 'Arial',
    size: 14,
    bold: true,
    underline: true,
    italic: true,
  };
  worksheet.getCell('B25').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('C25').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('H25').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('B26').style = {
    font: { name: 'Arial', size: 14 },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('C26').style = {
    font: { name: 'Arial', size: 14 },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('H26').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'right' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('H27').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'right' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('H28').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'right' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('H29').style = {
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'right' },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    },
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
    font: { name: 'Arial', size: 14 },
    alignment: { horizontal: 'right' },
  };
  worksheet.getCell('B31').style.font = {
    name: 'Arial',
    size: 14,
    bold: true,
    italic: true,
  };
  worksheet.getCell('B34').style = {
    font: {
      name: 'Arial',
      size: 14,
    },
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
  };
  worksheet.getCell('E34').style = {
    font: {
      name: 'Arial',
      size: 14,
    },
    alignment: { horizontal: 'right', vertical: 'middle' },
  };
  worksheet.getCell('B39').style = {
    font: { name: 'Arial', size: 14 },
    alignment: {
      vertical: 'top',
      wrapText: true,
    },
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
  worksheet.mergeCells('B19:E19');
  worksheet.mergeCells('B20:E20');
  worksheet.mergeCells('C25:G25');
  worksheet.mergeCells('C26:G26');
  worksheet.mergeCells('B34:C34');
  worksheet.mergeCells('B39:H39');

  const yandexPng = workbook.addImage({
    filename: 'static/yandex.png',
    extension: 'png',
  });
  const yandexSignPng = workbook.addImage({
    filename: 'static/yandex-sign.png',
    extension: 'png',
  });
  const yandexStampPng = workbook.addImage({
    filename: 'static/yandex-stamp.png',
    extension: 'png',
  });

  worksheet.addImage(yandexPng, {
    tl: { row: 0, col: 1 },
    ext: { width: 92, height: 47 },
  });

  worksheet.addImage(yandexSignPng, {
    tl: { row: 33, col: 3 },
    ext: { width: 107, height: 64 },
  });

  worksheet.addImage(yandexStampPng, {
    tl: { row: 30, col: 6 },
    ext: { width: 207, height: 205 },
  });

  worksheet.pageSetup.printArea = 'A1:I39';
  worksheet.pageSetup.scale = 70;
  worksheet.pageSetup.fitToPage = false;

  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
};
