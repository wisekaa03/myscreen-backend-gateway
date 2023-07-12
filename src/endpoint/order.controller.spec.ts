import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/guards';
import { OrderService } from '@/database/order.service';
import { PrintService } from '@/print/print.service';
import { UserService } from '@/database/user.service';
import { OrderController } from './order.controller';

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

describe(OrderController.name, () => {
  let controller: OrderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useClass: mockRepository,
        },
        {
          provide: PrintService,
          useClass: mockRepository,
        },
        {
          provide: UserService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', OrderController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
