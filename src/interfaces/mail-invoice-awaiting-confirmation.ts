import { UserEntity } from '@/database/user.entity';
import { InvoiceEntity } from '@/database/invoice.entity';

export interface MailInvoiceAwaitingConfirmation {
  user: UserEntity;
  invoice: InvoiceEntity;
}
