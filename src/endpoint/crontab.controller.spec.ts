import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { Roles } from '@/decorators/roles.decorator';
import { JwtAuthGuard, RolesGuard } from '@/guards';
import { UserRoleEnum } from '@/enums/user-role.enum';
import { CrontabService } from '@/crontab/crontab.service';
import { CrontabController } from './crontab.controller';
import { WalletService } from '@/database/wallet.service';
import { UserService } from '@/database/user.service';

jest.mock('cron');

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

describe(CrontabController.name, () => {
  let controller: CrontabController;
  const reflector = new Reflector();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrontabController],
      providers: [
        { provide: ConfigService, useClass: mockRepository },
        { provide: CrontabService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
        { provide: WalletService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get(CrontabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, CrontabController);
    const guardJwt = new guards[0]();
    const guardRoles = new guards[1]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
    expect(guardRoles).toBeInstanceOf(RolesGuard);

    const roles = reflector.get(Roles, CrontabController);
    expect(roles).toStrictEqual([UserRoleEnum.Administrator]);
  });

  // TODO: should inspect:
  // TODO: -
});
