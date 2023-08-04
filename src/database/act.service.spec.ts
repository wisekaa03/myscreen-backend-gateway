import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { WalletService } from './wallet.service';
import { ActEntity } from './act.entity';
import { ActService } from './act.service';

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

describe(ActService.name, () => {
  let service: ActService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActService,
        {
          provide: WalletService,
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(ActEntity),
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
