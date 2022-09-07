import type { JwtPayload } from 'jsonwebtoken';

import type { UserEntity } from '../database/user.entity';
import { UserRoleEnum } from '../enums/role.enum';

export const JWT_BASE_OPTIONS = {};

export interface MyscreenJwtPayload extends JwtPayload {
  sub: UserEntity['id'] | undefined;
  aud: UserRoleEnum[] | undefined;
}
