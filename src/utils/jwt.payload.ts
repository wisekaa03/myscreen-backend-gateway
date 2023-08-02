import type { JwtPayload } from 'jsonwebtoken';

import { UserRoleEnum } from '@/enums/user-role.enum';
import type { UserEntity } from '@/database/user.entity';

export const JWT_BASE_OPTIONS = {};

export interface MyscreenJwtPayload extends JwtPayload {
  sub: UserEntity['id'] | undefined;
  aud: UserRoleEnum[] | undefined;
}
