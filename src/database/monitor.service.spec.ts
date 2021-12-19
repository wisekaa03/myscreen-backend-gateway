import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MonitorEntity } from './monitor.entity';
import { MonitorService } from './monitor.service';

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

describe(MonitorService.name, () => {
  let monitorService: MonitorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorService,
        {
          provide: getRepositoryToken(MonitorEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    monitorService = module.get<MonitorService>(MonitorService);
  });

  it('should be defined', () => {
    expect(monitorService).toBeDefined();
  });
});
