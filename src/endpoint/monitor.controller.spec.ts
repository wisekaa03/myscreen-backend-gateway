import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { WSGateway } from '@/websocket/ws.gateway';
import { MonitorService } from '@/database/monitor.service';
import { PlaylistService } from '@/database/playlist.service';
import { ApplicationService } from '@/database/application.service';
import { UserService } from '@/database/user.service';
import { MonitorController } from './monitor.controller';
import { AuthService } from '@/auth/auth.service';

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
        { provide: ApplicationService, useClass: mockRepository },
        { provide: WSGateway, useClass: mockRepository },
        { provide: AuthService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<MonitorController>(MonitorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', MonitorController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
