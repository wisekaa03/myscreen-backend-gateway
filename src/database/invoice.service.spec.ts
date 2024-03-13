import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';

import { MAIL_SERVICE } from '@/constants';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceService } from './invoice.service';
import { WalletService } from './wallet.service';
import { UserService } from './user.service';
import { ActService } from './act.service';
import { MonitorService } from './monitor.service';
import { UserResponse } from './user-response.entity';
import { UserEntity } from './user.entity';

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

describe(InvoiceService.name, () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        InvoiceService,
        { provide: UserService, useClass: mockRepository },
        { provide: WalletService, useClass: mockRepository },
        { provide: MAIL_SERVICE, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        { provide: ActService, useClass: mockRepository },
        { provide: MonitorService, useClass: mockRepository },
        {
          provide: getRepositoryToken(InvoiceEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserResponse),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
