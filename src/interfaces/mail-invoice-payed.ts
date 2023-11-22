import { UserEntity } from '@/database/user.entity';
import { InvoiceEntity } from '@/database/invoice.entity';

export interface MailInvoicePayed {
  user: UserEntity;
  invoice: InvoiceEntity;
  balance: number;
}
