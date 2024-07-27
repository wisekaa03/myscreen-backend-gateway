import { UserEntity } from '@/database/user.entity';

export interface MsvcMailBalanceChanged {
  user: UserEntity;
  sum: number;
  balance: number;
}
