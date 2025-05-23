import { UserEntity } from '@/database/user.entity';
import { InvoiceEntity } from '@/database/invoice.entity';

export interface MsvcMailInvoiceConfirmed {
  user: UserEntity;
  invoice: InvoiceEntity;
  invoiceFile: Buffer;
}
