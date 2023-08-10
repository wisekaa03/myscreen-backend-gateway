import { Reflector } from '@nestjs/core';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, UseGuards } from '@nestjs/common';

import { UserRoleEnum, CRUD } from '@/enums';
import { Roles, Crud } from '@/decorators';
import { UserService } from '@/database/user.service';
import { RolesGuard } from './roles.guard';

@Roles(UserRoleEnum.Administrator)
@UseGuards(RolesGuard)
@Crud(CRUD.UPDATE)
class MockRole {}

describe(RolesGuard.name, () => {
  let rolesGuard: RolesGuard;

  it('should be defined', () => {
    const userService = createMock<UserService>();
    rolesGuard = new RolesGuard(new Reflector(), userService);
    expect(rolesGuard).toBeDefined();
  });

  it('canActivate roles', () => {
    const roles = Reflect.getMetadata('roles', MockRole);
    expect(roles).toStrictEqual([UserRoleEnum.Administrator]);

    const guards = Reflect.getMetadata('__guards__', MockRole);

    const reflector = new Reflector();
    const guardRoles = new guards[0](reflector);
    expect(guardRoles).toBeInstanceOf(RolesGuard);
    expect(guardRoles).toEqual({ reflector });
    const mockExecutionContext = createMock<ExecutionContext>();
    const result = guardRoles.canActivate(mockExecutionContext);
    expect(result).toBeTruthy();
  });
});
