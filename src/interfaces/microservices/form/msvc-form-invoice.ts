import { SpecificFormat } from '@/enums';
import { InvoiceEntity } from '@/database/invoice.entity';

export interface MsvcFormInvoice {
  format: SpecificFormat;
  invoice: InvoiceEntity;
  language: string;
}
