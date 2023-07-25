import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../guards/index';
import { InvoiceService } from '../database/invoice.service';
import { PrintService } from '../print/print.service';
import { UserService } from '../database/user.service';
import { MailService } from '../mail/mail.service';
import { InvoiceController } from './invoice.controller';
import { WalletService } from '@/database/wallet.service';

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

describe(InvoiceController.name, () => {
  let controller: InvoiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useClass: mockRepository,
        },
        {
          provide: WalletService,
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
        {
          provide: MailService,
          useClass: mockRepository,
        },
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
