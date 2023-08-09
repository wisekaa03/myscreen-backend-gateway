import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@/guards';
import { InvoiceService } from '@/database/invoice.service';
import { UserService } from '@/database/user.service';
import { InvoiceController } from './invoice.controller';

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

describe(InvoiceController.name, () => {
  let controller: InvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        { provide: UserService, useClass: mockRepository },
        { provide: InvoiceService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get(InvoiceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', InvoiceController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
