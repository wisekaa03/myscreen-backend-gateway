import PdfMake from 'pdfmake';

import { pdfFonts } from '@/print/print.utils';
import { UserEntity } from '@/database/user.entity';
import { MonitorEntity } from '@/database/monitor.entity';

export const deviceStatusPdf = async ({
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
  const docDefinition = {
    content: ['Отчет по статусам устройств'],
  };

  const pdfMake = new PdfMake(pdfFonts);
  const pdf = pdfMake.createPdfKitDocument(docDefinition);
  pdf.end();

  const chunks: Buffer[] = [];
  const result = await new Promise<Buffer>((resolve) => {
    pdf.on('data', (chunk) => chunks.push(chunk));
    pdf.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });

  return result;
};
