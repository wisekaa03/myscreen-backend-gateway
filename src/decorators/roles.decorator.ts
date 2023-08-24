import { Reflector } from '@nestjs/core';
import type { UserRoleEnum } from '@/enums/user-role.enum';

export const Roles = Reflector.createDecorator<UserRoleEnum[]>();
