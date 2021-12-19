import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderEntity } from './order.entity';
import { OrderService } from './order.service';

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

describe(OrderService.name, () => {
  let orderService: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(OrderEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    orderService = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(orderService).toBeDefined();
  });
});
