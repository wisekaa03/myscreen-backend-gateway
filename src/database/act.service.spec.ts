import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken, getRepositoryToken } from '@nestjs/typeorm';

import { WalletService } from './wallet.service';
import { ActEntity } from './act.entity';
import { ActService } from './act.service';
import { WsStatistics } from './ws.statistics';

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

describe(ActService.name, () => {
  let service: ActService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActService,
        { provide: WalletService, useClass: mockRepository },
        { provide: WsStatistics, useClass: mockRepository },
        {
          provide: getRepositoryToken(ActEntity),
          useClass: mockRepository,
        },
        {
          provide: getEntityManagerToken(),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ActService>(ActService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
