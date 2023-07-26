import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PrintService } from '@/print/print.service';
import { WalletService } from './wallet.service';
import { WalletEntity } from './wallet.entity';

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

describe(WalletService.name, () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(WalletEntity),
          useClass: mockRepository,
        },
        {
          provide: PrintService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
