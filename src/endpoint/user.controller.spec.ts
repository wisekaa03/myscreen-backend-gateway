import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { Roles } from '@/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { UserService } from '@/database/user.service';
import { UserController } from './user.controller';

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

describe(UserController.name, () => {
  let controller: UserController;
  const reflector = new Reflector();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useClass: mockRepository }],
    }).compile();

    controller = module.get(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, UserController);
    const guardJwt = new guards[0]();
    const guardRoles = new guards[1]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
    expect(guardRoles).toBeInstanceOf(RolesGuard);

    const roles = reflector.get(Roles, UserController);
    expect(roles).toStrictEqual([UserRoleEnum.Administrator]);
  });

  // DEBUG: should inspect:
  // DEBUG: - users, user, userUpdate, disableUser, enableUser, deleteUser
});
