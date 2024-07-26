import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { MonitorOnlineEntity } from './monitor-online.entity';
import { MonitorOnlineService } from './monitor-online.service';

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

describe(MonitorOnlineService.name, () => {
  let service: MonitorOnlineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorOnlineService,
        { provide: ConfigService, useClass: mockRepository },
        {
          provide: getRepositoryToken(MonitorOnlineEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MonitorOnlineService>(MonitorOnlineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
