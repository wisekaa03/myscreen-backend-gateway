import { Reflector } from '@nestjs/core';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, UseGuards } from '@nestjs/common';

import { UserRoleEnum } from '@/enums';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Roles(UserRoleEnum.Administrator)
@UseGuards(RolesGuard)
class MockRole {}

describe(RolesGuard.name, () => {
  let rolesGuard: RolesGuard;

  it('should be defined', () => {
    rolesGuard = new RolesGuard(new Reflector());
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
    expect(result).toBe(true);
  });
});
