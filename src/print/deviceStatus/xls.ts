import excelJS from 'exceljs';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { UserEntity } from '@/database/user.entity';
import { MonitorEntity } from '@/database/monitor.entity';

export const deviceStatusXls = async ({
  user,
  monitors,
  dateFrom,
  dateTo,
}: {
  user: UserEntity;
  monitors?: MonitorEntity[];
  dateFrom: Date;
  dateTo: Date;
}) => {
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet('Отчет по статусам устройств');

  const rows = [
    ['Отчет по статусам устройств'],
    [`Период отчета: с ${dateFrom} по ${dateTo}`],
    [],
    [],
    ['Название устройства', '', '', 'Название папки', '', 'Адрес', ''],
    [
      'Samsung',
      '',
      '',
      'АЗС-123',
      '',
      'Челябинская область, Сосновский район, 35 км а/д Челябинск-Троицк',
    ],
    [],
    [
      '',
      'Статус',
      'Дата начала',
      'Дата окончания',
      'Продолжительность',
      '',
      'Описание ошибки',
    ],
    [
      '',
      'online',
      '23.04.2021 18:29:43',
      '24.04.2021 10:44:27',
      '16 часов 14 минут 44 секунды',
    ],
    ['', 'offline', '24.04.2021 10:44:27', '24.04.2021 10:44:32', '5 секунд'],
  ];
  worksheet.addRows(rows);
  worksheet.columns = [
    {
      width: 1,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 10,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 19,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 19,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 11,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 30,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 30,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
    {
      width: 30,
      style: {
        font: { name: 'Arial', size: 11 },
        alignment: { vertical: 'middle' },
      },
    },
  ];
  worksheet.getRow(7).height = 4;

  worksheet.getCell('A1').style = {
    font: {
      name: 'Arial',
      size: 14,
      bold: true,
    },
  };
  worksheet.getCell('A5').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('D5').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('F5').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };

  worksheet.getCell('A6').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('D6').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('F6').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };

  worksheet.getCell('B8').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('C8').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('D8').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('E8').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('G8').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };

  worksheet.getCell('B9').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('C9').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('D9').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('E9').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('G9').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };

  worksheet.getCell('B10').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('C10').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('D10').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('E10').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };
  worksheet.getCell('G10').style = {
    font: {
      name: 'Arial',
      size: 11,
    },
    border: {
      top: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
    },
  };

  worksheet.mergeCells('A5:C5');
  worksheet.mergeCells('D5:E5');
  worksheet.mergeCells('F5:H5');
  worksheet.mergeCells('D6:E6');
  worksheet.mergeCells('A6:C6');
  worksheet.mergeCells('F6:H6');
  worksheet.mergeCells('E8:F8');
  worksheet.mergeCells('G8:H8');
  worksheet.mergeCells('E9:F9');
  worksheet.mergeCells('G9:H9');
  worksheet.mergeCells('E10:F10');
  worksheet.mergeCells('G10:H10');

  // worksheet.pageSetup.printArea = 'A1:I39';
  worksheet.pageSetup.scale = 70;
  worksheet.pageSetup.fitToPage = false;

  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
};
