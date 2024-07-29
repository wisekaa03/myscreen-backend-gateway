import { UserEntity } from '@/database/user.entity';
import { InvoiceEntity } from '@/database/invoice.entity';

export interface MsvcMailInvoiceAwaitingConfirmation {
  user: UserEntity;
  invoice: InvoiceEntity;
}
