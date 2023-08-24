import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { Roles } from '@/decorators/roles.decorator';
import { UserRoleEnum } from '@/enums';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { WSGateway } from '@/websocket/ws.gateway';
import { ApplicationService } from '@/database/application.service';
import { UserService } from '@/database/user.service';
import { ApplicationController } from './application.controller';

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

describe(ApplicationController.name, () => {
  let controller: ApplicationController;
  const reflector = new Reflector();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [
        { provide: ApplicationService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
        { provide: WSGateway, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get(ApplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles', async () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, ApplicationController);
    const guardJwt = new guards[0]();
    const guardRoles = new guards[1]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
    expect(guardRoles).toBeInstanceOf(RolesGuard);

    const roles = reflector.get(Roles, ApplicationController);
    expect(roles).toEqual([
      UserRoleEnum.Administrator,
      UserRoleEnum.Advertiser,
      UserRoleEnum.MonitorOwner,
    ]);
  });

  // TODO: should inspect:
  // TODO: -
});
