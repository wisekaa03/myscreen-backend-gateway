import { SetMetadata } from '@nestjs/common';
import type { UserRoleEnum } from '../enums/role.enum';

export const Roles = (...roles: UserRoleEnum[]) => SetMetadata('roles', roles);
