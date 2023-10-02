import type { Request as ExpressRequest } from 'express';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';

import { CRUD } from '@/enums/crud.enum';
import { Crud, Roles } from '@/decorators';
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

    const requiredRoles = this.reflector.getAllAndOverride(Roles, [
      executionHanlder,
      executionClass,
    ]);
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<ExpressRequest>();
    const { role: userRole } = user;

    const className = this.reflector.get<string, string>(
      PATH_METADATA,
      executionClass,
    );
    const functionName = executionHanlder.name;
    const requiredCRUD =
      this.reflector.getAllAndOverride(Crud, [
        executionHanlder,
        executionClass,
      ]) ?? CRUD.READ;
    this.userService.verify(user, className, functionName, requiredCRUD);

    return !userRole ? false : requiredRoles.some((role) => userRole === role);
  }
}
