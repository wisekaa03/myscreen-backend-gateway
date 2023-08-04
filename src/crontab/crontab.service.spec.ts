import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';

import { CrontabService } from './crontab.service';
import { WalletService } from '@/database/wallet.service';

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

describe(CrontabService.name, () => {
  let service: CrontabService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrontabService,
        {
          provide: WalletService,
          useClass: mockRepository,
        },
        {
          provide: SchedulerRegistry,
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CrontabService>(CrontabService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
