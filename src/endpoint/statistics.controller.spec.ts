import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';

import { MAIL_SERVICE } from '@/interfaces';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { StatisticsController } from './statistics.controller';
import { MonitorService } from '@/database/monitor.service';
import { UserService } from '@/database/user.service';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  emit: async (event: string, data: unknown) =>
    new Observable((s) => s.next(data)),
  send: async (id: unknown) => new Observable((s) => s.next(id)),
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(StatisticsController.name, () => {
  let controller: StatisticsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        { provide: MonitorService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
        { provide: MAIL_SERVICE, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, StatisticsController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // DEBUG: should inspect:
  // DEBUG: -
});
