import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request as ExpressRequest } from 'express';

import type { UserRole } from '@/database/enums/role.enum';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<ExpressRequest>();
    const { user } = request;
    return this.matchRoles(roles, user?.role);
  }

  matchRoles(roles: UserRole[], role: UserRole) {
    return roles.every((r) => role === r);
  }
}
