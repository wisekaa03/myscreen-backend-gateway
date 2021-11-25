import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/database/enums/role.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
