import { CellObject, ColInfo, Range, RowInfo } from 'xlsx-js-style/types';

export interface PrintSpecific {
  xls: CellObject[][];
  cols: ColInfo[];
  rows: RowInfo[];
  merges: Range[];
}

export const printSpecific: Record<string, PrintSpecific> = {
  invoice: {
    xls: [
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
        {
          v: 'Получатель',
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
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Сч. №',
          t: 's',
          s: {
            alignment: { vertical: 'top' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: '40702810600014307627',
          t: 's',
          s: {
            alignment: { vertical: 'top' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: '',
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
        { v: '', t: 's' },
        {
          v: 'ИНН/КПП 7736207543/997750001 ООО "ЯНДЕКС"',
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
        { v: '', t: 's' },
        {
          v: 'Банк получателя',
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
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'БИК',
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
          v: '44525545',
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
          v: '',
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
        { v: '', t: 's' },
        {
          v: 'АО Юникредит Банк, 119034, г. Москва, Пречистенская наб., д. 9 ',
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
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Сч. №',
          t: 's',
          s: {
            alignment: { vertical: 'top' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: '30101810300000000000000',
          t: 's',
          s: {
            alignment: { vertical: 'top' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: '',
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
      [],
      [
        { v: '', t: 's' },
        {
          v: 'Условия для расчетов',
          t: 's',
          s: { font: { bold: true, underline: true, italic: true } },
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
      [
        { v: '', t: 's' },
        {
          v: 'Заказчик: ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТОПАРТ"',
          t: 's',
          s: { alignment: { wrapText: true, vertical: 'top' } },
        },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Телефоны: 8(8553) 37-72-62',
          t: 's',
          s: { alignment: { wrapText: true, vertical: 'top' } },
        },
      ],
      [
        { v: '', t: 's' },
        {
          v: 'Представитель заказчика: Тухбатуллина Юлия Евгеньевна',
          t: 's',
          s: { alignment: { wrapText: true, vertical: 'top' } },
        },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Факс: 8(8553) 37-72-62',
          t: 's',
          s: { alignment: { wrapText: true, vertical: 'top' } },
        },
      ],
      [],
      [
        { v: '', t: 's' },
        {
          v: 'Основание:',
          t: 's',
          s: { font: { underline: true, bold: true, italic: true } },
        },
      ],
      [
        { v: '', t: 's' },
        {
          v: 'Оферта/Условия оказания услуг:',
          t: 's',
        },
      ],
      [],
      [
        { v: '', t: 's' },
        {
          v: '№',
          t: 's',
          s: {
            alignment: { horizontal: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        {
          v: 'Наименование товара, работы, услуги',
          t: 's',
          s: {
            alignment: { horizontal: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Сумма, рубли РФ',
          t: 's',
          s: {
            alignment: { horizontal: 'center' },
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
        { v: '', t: 's' },
        {
          v: '1',
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
          v: 'Услуги «Яндекс.Директ».',
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
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: '5000',
          t: 'n',
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
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Итого без НДС:',
          t: 's',
          s: {
            alignment: { horizontal: 'right' },
          },
        },
        {
          v: '5000',
          t: 'n',
          s: {
            alignment: { horizontal: 'right' },
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
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'НДС:',
          t: 's',
          s: {
            alignment: { horizontal: 'right' },
          },
        },
        {
          v: '1000',
          t: 'n',
          s: {
            alignment: { horizontal: 'right' },
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
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        {
          v: 'Всего к оплате, рубли РФ:',
          t: 's',
          s: {
            alignment: { horizontal: 'right' },
            font: { bold: true },
          },
        },
        {
          v: '6000',
          t: 'n',
          s: {
            alignment: { horizontal: 'right' },
            font: { bold: true },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
            },
          },
        },
      ],
      [],
      [
        { v: '', t: 's' },
        {
          v: 'К оплате: Шесть тысяч рублей 00 копеек',
          t: 's',
          s: { font: { bold: true } },
        },
      ],
      [
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '', t: 's' },
        { v: '(Л.Ф. Савков)', t: 's' },
      ],
      [
        { v: '', t: 's' },
        { v: 'Коммерческий директор', t: 's' },
      ],
      [
        { v: '', t: 's' },
        { v: 'По доверенности №95 от 15.06.2018', t: 's' },
      ],
      [],
      [],
      [],
      [],
      [
        { v: '', t: 's' },
        {
          v: 'Настоящий счет («Счет») выставлен в соответствии с Офертой на заключение договора возмездного оказания услуг (https://yandex.ru/legal/oferta_direct/ , https://yandex.ru/legal/directory_conditions/ , http://advertising.yandex.ru/price.xml , https://yandex.ru/legal/oferta_yandex_navy_ad/). Оплачивая настоящий Счет, Вы подтверждаете, что полностью и безоговорочно согласились с условиями Оферты и Договора, заключенного между Яндексом и Вами на условиях Оферты.',
          t: 's',
          s: { alignment: { wrapText: true, vertical: 'top' } },
        },
      ],
    ],
    cols: [
      { wch: 5 },
      { wch: 5 },
      { wch: 19 },
      { wch: 11 },
      { wch: 15 },
      { wch: 11 },
      { wch: 11 },
      { wch: 16 },
    ],
    rows: [
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      { hpx: 24 },
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      { hpx: 24 },
      { hpx: 24 },
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      {},
      { hpx: 72 },
    ],
    merges: [
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

      { s: { r: 18, c: 1 }, e: { r: 18, c: 4 } },
      { s: { r: 18, c: 5 }, e: { r: 18, c: 7 } },
      { s: { r: 19, c: 1 }, e: { r: 19, c: 4 } },
      { s: { r: 19, c: 5 }, e: { r: 19, c: 7 } },

      { s: { r: 24, c: 2 }, e: { r: 24, c: 6 } },
      { s: { r: 25, c: 2 }, e: { r: 25, c: 6 } },

      { s: { r: 38, c: 1 }, e: { r: 38, c: 7 } },
    ],
  },
};
