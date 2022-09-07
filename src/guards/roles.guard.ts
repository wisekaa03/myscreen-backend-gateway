import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request as ExpressRequest } from 'express';

import type { UserRoleEnum } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const {
      user: { role: userRoles },
    } = context.switchToHttp().getRequest<ExpressRequest>();
    if (!Array.isArray(userRoles)) {
      return false;
    }
    return requiredRoles.some((role) =>
      userRoles.some((userRole) => role === userRole),
    );
  }
}
