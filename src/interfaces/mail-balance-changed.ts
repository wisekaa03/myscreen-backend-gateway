import { UserEntity } from '@/database/user.entity';

export interface MailBalanceChanged {
  user: UserEntity;
  sum: number;
  balance: number;
}
