import { Reflector } from '@nestjs/core';
import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { UserRoleEnum, CRUD } from '@/enums';
import { Roles, Crud } from '@/decorators';
import { UserService } from '@/database/user.service';
import { RolesGuard } from './roles.guard';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

@Roles([UserRoleEnum.Administrator])
@UseGuards(RolesGuard)
@Crud(CRUD.UPDATE)
class MockRole {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}
}

describe(RolesGuard.name, () => {
  let rolesGuard: RolesGuard;
  const reflector = new Reflector();

  it('decorator', () => {
    const userService = createMock<UserService>();
    rolesGuard = new RolesGuard(reflector, userService);
    expect(rolesGuard).toBeDefined();
  });

  it('canActivate roles', () => {
    const roles = reflector.get(Roles, MockRole);
    expect(roles).toStrictEqual([UserRoleEnum.Administrator]);

    const guards = Reflect.getMetadata(GUARDS_METADATA, MockRole);

    const guardRoles = new guards[0](reflector);
    expect(guardRoles).toBeInstanceOf(RolesGuard);
    expect(guardRoles).toEqual({ reflector });

    const mockExecutionContext = createMock<ExecutionContext>();
    const result = guardRoles.canActivate(mockExecutionContext);
    expect(result).toBe(true);
  });
});
