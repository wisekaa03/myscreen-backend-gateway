import { Test, TestingModule } from '@nestjs/testing';

// import { JwtAuthGuard } from '@/guards';
import { PaymentLogService } from '@/database/payment-log.service';
import { PaymentLogController } from './log.controller';

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

describe(PaymentLogController.name, () => {
  let controller: PaymentLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentLogController],
      providers: [
        {
          provide: PaymentLogService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<PaymentLogController>(PaymentLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: -
});
