import { Test, TestingModule } from '@nestjs/testing';

import { PrintService } from './print.service';

export const mockRepository = jest.fn(() => ({
  findById: async () => Promise.resolve({}),
  findOne: async () => Promise.resolve({}),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve({}),
  create: () => {},
  remove: async () => Promise.resolve({}),
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(PrintService.name, () => {
  let printService: PrintService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrintService],
    }).compile();

    printService = module.get(PrintService);
  });

  it('should be defined', () => {
    expect(printService).toBeDefined();
  });
});
