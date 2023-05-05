import { Test, TestingModule } from '@nestjs/testing';
import { MonitorService } from '../database/monitor.service';
import { XlsxService } from './xlsx.service';

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

describe(XlsxService.name, () => {
  let xlsxService: XlsxService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XlsxService,
        {
          provide: MonitorService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    xlsxService = module.get<XlsxService>(XlsxService);
  });

  it('should be defined', () => {
    expect(xlsxService).toBeDefined();
  });
});
