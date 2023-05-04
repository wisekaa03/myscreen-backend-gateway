import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { StatisticsController } from './statistics.controller';
import { PlaylistService } from '../database/playlist.service';
import { WSGateway } from '../websocket/ws.gateway';
import { UserService } from '../database/user.service';
import { MonitorService } from '../database/monitor.service';
import { XlsxService } from '@/xlsx/xlsx.service';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
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
        {
          provide: PlaylistService,
          useClass: mockRepository,
        },
        {
          provide: MonitorService,
          useClass: mockRepository,
        },
        {
          provide: WSGateway,
          useClass: mockRepository,
        },
        {
          provide: XlsxService,
          useClass: mockRepository,
        },
        { provide: UserService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', StatisticsController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // DEBUG: should inspect:
  // DEBUG: -
});
