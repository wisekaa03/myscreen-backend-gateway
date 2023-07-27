import { Test, TestingModule } from '@nestjs/testing';

import { UserService } from '@/database/user.service';
import { MonitorService } from '@/database/monitor.service';
import { InvoiceService } from '@/database/invoice.service';
import { PrintService } from './print.service';

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

describe(PrintService.name, () => {
  let xlsxService: PrintService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrintService,
        {
          provide: MonitorService,
          useClass: mockRepository,
        },
        {
          provide: UserService,
          useClass: mockRepository,
        },
        {
          provide: InvoiceService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    xlsxService = module.get(PrintService);
  });

  it('should be defined', () => {
    expect(xlsxService).toBeDefined();
  });
});
