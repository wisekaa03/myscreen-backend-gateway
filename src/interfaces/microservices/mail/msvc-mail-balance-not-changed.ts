import { UserEntity } from '@/database/user.entity';

export interface MsvcMailBalanceNotChanged {
  user: UserEntity;
  sum: number;
  balance: number;
}
