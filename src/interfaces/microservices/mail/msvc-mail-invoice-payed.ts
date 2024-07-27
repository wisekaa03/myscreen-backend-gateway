import { UserEntity } from '@/database/user.entity';
import { InvoiceEntity } from '@/database/invoice.entity';

export interface MsvcMailInvoicePayed {
  user: UserEntity;
  invoice: InvoiceEntity;
  balance: number;
}
