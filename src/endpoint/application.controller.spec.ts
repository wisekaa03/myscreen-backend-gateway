import { Test, TestingModule } from '@nestjs/testing';

// import { JwtAuthGuard } from '@/guards';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationController],
      providers: [
        { provide: ApplicationService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
        { provide: WSGateway, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<ApplicationController>(ApplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: -
});
