import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { LogService } from './log.service';
import { LogEntity } from './log.entity';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  insert: async () => Promise.resolve([]),
  update: async () => Promise.resolve([]),
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  getOrThrow: (key: string, defaultValue?: string) => '5',
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(LogService.name, () => {
  let service: LogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        { provide: UserService, useClass: mockRepository },
        {
          provide: getRepositoryToken(LogEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get(LogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
