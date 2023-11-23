import { UserEntity } from '@/database/user.entity';

export interface MailBalanceNotChanged {
  user: UserEntity;
  sum: number;
  balance: number;
}
