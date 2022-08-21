import { Test, TestingModule } from '@nestjs/testing';

// import { JwtAuthGuard } from '@/guards';
import { WSGateway } from '@/websocket/ws.gateway';
import { CooperationService } from '@/database/cooperation.service';
import { CooperationController } from './cooperation.controller';

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

describe(CooperationController.name, () => {
  let controller: CooperationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CooperationController],
      providers: [
        {
          provide: CooperationService,
          useClass: mockRepository,
        },
        {
          provide: WSGateway,
          useClass: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<CooperationController>(CooperationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: -
});
