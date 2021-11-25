import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@/database/enums/role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
