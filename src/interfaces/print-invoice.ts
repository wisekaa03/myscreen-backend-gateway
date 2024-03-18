import { SpecificFormat } from '@/enums';
import { InvoiceEntity } from '@/database/invoice.entity';

export interface PrintInvoice {
  format: SpecificFormat;
  invoice: InvoiceEntity;
  language: string;
}
