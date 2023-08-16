import { SetMetadata } from '@nestjs/common';
import type { UserRoleEnum } from '@/enums/user-role.enum';

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata('roles', roles);
