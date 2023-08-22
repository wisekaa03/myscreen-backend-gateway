import PdfMake from 'pdfmake';

import { pdfFonts } from '@/print/print.utils';
import { InvoiceEntity } from '@/database/invoice.entity';

export const invoicePdf = async ({ invoice }: { invoice: InvoiceEntity }) => {
  const docDefinition = {
    content: ['Счет'],
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
