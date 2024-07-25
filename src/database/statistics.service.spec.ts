import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { StatisticsService } from './statistics.service';
import { StatisticsEntity } from './statistics.entity';

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

describe(StatisticsService.name, () => {
  let service: StatisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: ConfigService, useClass: mockRepository },
        {
          provide: getRepositoryToken(StatisticsEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
