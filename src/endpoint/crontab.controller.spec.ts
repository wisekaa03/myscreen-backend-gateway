import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard, RolesGuard } from '@/guards';
import { UserRoleEnum } from '@/enums';
import { CrontabService } from '@/crontab/crontab.service';
import { CrontabController } from './crontab.controller';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrontabController],
      providers: [{ provide: CrontabService, useClass: mockRepository }],
    }).compile();

    controller = module.get<CrontabController>(CrontabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', CrontabController);
    const guardJwt = new guards[0]();
    const guardRoles = new guards[1]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
    expect(guardRoles).toBeInstanceOf(RolesGuard);

    const roles = Reflect.getMetadata('roles', CrontabController);
    expect(roles).toStrictEqual([UserRoleEnum.Administrator]);
  });

  // TODO: should inspect:
  // TODO: -
});
