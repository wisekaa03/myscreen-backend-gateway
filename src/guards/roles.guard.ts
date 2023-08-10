import type { Request as ExpressRequest } from 'express';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

import { CRUD, UserRoleEnum } from '@/enums';
import { CRUD_METADATA } from '@/decorators';
import { UserService } from '@/database/user.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const executionClass = context.getClass();
    const executionHanlder = context.getHandler();

    const requiredRoles = this.reflector.getAllAndOverride<
      UserRoleEnum[],
      string
    >('roles', [executionHanlder, executionClass]);
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<ExpressRequest>();
    const { role: userRole } = user;

    const executionName = this.reflector.getAllAndOverride<string, string>(
      PATH_METADATA,
      [executionClass],
    );
    const requiredCRUD = this.reflector.getAllAndOverride<CRUD, string>(
      CRUD_METADATA,
      [executionHanlder, executionClass],
    );
    this.userService.verify(executionName, requiredCRUD ?? CRUD.READ, user);

    return !userRole ? false : requiredRoles.some((role) => userRole === role);
  }
}
