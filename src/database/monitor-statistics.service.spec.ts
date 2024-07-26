import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { MonitorStatisticsService } from './monitor-statistics.service';
import { MonitorStatisticsEntity } from './monitor-statistics.entity';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  insert: async () => Promise.resolve([]),
  update: async () => Promise.resolve([]),
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(MonitorStatisticsService.name, () => {
  let service: MonitorStatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorStatisticsService,
        { provide: ConfigService, useClass: mockRepository },
        {
          provide: getRepositoryToken(MonitorStatisticsEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MonitorStatisticsService>(MonitorStatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
