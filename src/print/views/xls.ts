import excelJS from 'exceljs';
import { format } from '@vicimpa/rubles';
import { format as dateFormat } from 'date-fns';
import dateRu from 'date-fns/locale/ru';

import { UserEntity } from '@/database/user.entity';
import { MonitorEntity } from '@/database/monitor.entity';

export const viewsXls = async ({
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
  const worksheet = workbook.addWorksheet('Отчёт по показам');

  worksheet.addRow(['Отчёт по показам']);

  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
};
