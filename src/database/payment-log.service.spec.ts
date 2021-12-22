import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentLogEntity } from './payment-log.entity';
import { PaymentLogService } from './payment-log.service';

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

describe(PaymentLogService.name, () => {
  let logService: PaymentLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentLogService,
        {
          provide: getRepositoryToken(PaymentLogEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    logService = module.get<PaymentLogService>(PaymentLogService);
  });

  it('should be defined', () => {
    expect(logService).toBeDefined();
  });
});
