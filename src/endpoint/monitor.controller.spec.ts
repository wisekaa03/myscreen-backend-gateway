import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { MonitorService } from '@/database/monitor.service';
import { PlaylistService } from '@/database/playlist.service';
import { BidService } from '@/database/bid.service';
import { UserService } from '@/database/user.service';
import { MonitorController } from './monitor.controller';
import { AuthService } from '@/auth/auth.service';
import { WsStatistics } from '@/database/ws.statistics';

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

describe(MonitorController.name, () => {
  let controller: MonitorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitorController],
      providers: [
        { provide: MonitorService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
        { provide: PlaylistService, useClass: mockRepository },
        { provide: BidService, useClass: mockRepository },
        { provide: WsStatistics, useClass: mockRepository },
        { provide: AuthService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<MonitorController>(MonitorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, MonitorController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
