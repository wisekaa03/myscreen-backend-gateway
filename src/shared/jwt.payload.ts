import type { JwtPayload } from 'jsonwebtoken';
import type { UserEntity } from '../database/user.entity';

export interface MyscreenJwtPayload extends JwtPayload {
  sub: UserEntity['id'];
}
