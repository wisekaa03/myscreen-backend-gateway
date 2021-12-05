import { SetMetadata } from '@nestjs/common';
import type { UserRoleEnum } from '@/database/enums/role.enum';

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata('roles', roles);
