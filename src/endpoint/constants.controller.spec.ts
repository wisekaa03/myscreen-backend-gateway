import { Test, TestingModule } from '@nestjs/testing';

import { ConstantsController } from './constants.controller';
import { UserService } from '@/database/user.service';
import { WalletService } from '@/database/wallet.service';
import { InvoiceService } from '@/database/invoice.service';
import { BidService } from '@/database/bid.service';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe('ConstantsController', () => {
  let controller: ConstantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConstantsController],
      providers: [
        { provide: UserService, useClass: mockRepository },
        { provide: WalletService, useClass: mockRepository },
        { provide: InvoiceService, useClass: mockRepository },
        { provide: BidService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<ConstantsController>(ConstantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
