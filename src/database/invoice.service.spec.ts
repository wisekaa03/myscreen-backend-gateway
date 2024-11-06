import { Readable } from 'stream';
import { Observable, of } from 'rxjs';
import { Test, TestingModule } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { getEntityManagerToken, getRepositoryToken } from '@nestjs/typeorm';

import { InvoiceStatus, UserRoleEnum } from '@/enums';
import { InvoiceEntity } from './invoice.entity';
import { InvoiceService } from './invoice.service';
import { WalletService } from './wallet.service';
import { UserExtView } from './user-ext.view';
import { UserEntity } from './user.entity';
import { WsStatistics } from './ws.statistics';
import { FileService } from './file.service';
import { FolderService } from './folder.service';
import { FileExtView } from './file-ext.view';

const idMock = '00000000-0000-0000-0000-000000000000';
const email = 'postmaster@domain.com';
const balance = 1000;

const user: UserEntity = {
  id: idMock,
  email,
  disabled: false,
  surname: 'Test',
  name: 'Test',
  middleName: 'Test',
  role: UserRoleEnum.Administrator,
  verified: true,
  password: 'mock password',
  city: 'Keasnodar',
  country: 'RU',
  preferredLanguage: 'ru',
  locale: 'ru-RU',
  nonPayment: 0,
  storageSpace: '0',
};
const invoice: InvoiceEntity = {
  id: idMock,
  seqNo: 1,
  description: 'Test description',
  status: InvoiceStatus.CONFIRMED_PENDING_PAYMENT,
  sum: 1000,
  user,
  userId: idMock,
  file: null,
};

const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve(invoice),
  findAndCount: async () => Promise.resolve([invoice]),
  save: async () => Promise.resolve(invoice),
  create: () => invoice,
  remove: async () => Promise.resolve([]),
  update: async () => Promise.resolve(),
  get: (key: string, defaultValue?: string) => defaultValue,
  getOrThrow: (key: string, defaultValue?: string) => '100',
  getS3Object: async () => Promise.resolve({ Body: Readable }),
  send: (): Observable<Buffer> => of(Buffer.from('test')),
  emit: (): Observable<string> => of('test'),
  onWallet: async () => Promise.resolve(),
  walletSum: async () => Promise.resolve(balance),
  invoiceFolder: async () => Promise.resolve(''),
  upload: async () => Promise.resolve([{ id: idMock } as FileExtView]),
  acceptanceActCreate: async () => Promise.resolve(),
  metadata: {
    columns: [],
    relations: [],
  },
}));

const mockEntityManager = {
  find: async () => Promise.resolve([invoice]),
  findOne: async () => Promise.resolve(invoice),
  findAndCount: async () => Promise.resolve([invoice]),
  save: async () => Promise.resolve(invoice),
  create: () => invoice,
  remove: async () => Promise.resolve([]),
  update: async () => Promise.resolve({ affected: 1 }),
  metadata: {
    columns: [],
    relations: [],
  },
};

describe(InvoiceService.name, () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        InvoiceService,
        { provide: ConfigService, useClass: mockRepository },
        { provide: WalletService, useClass: mockRepository },
        { provide: FolderService, useClass: mockRepository },
        { provide: FileService, useClass: mockRepository },
        { provide: WsStatistics, useClass: mockRepository },
        {
          provide: getRepositoryToken(InvoiceEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserExtView),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useClass: mockRepository,
        },
        {
          provide: getEntityManagerToken(),
          useValue: {
            transaction: jest
              .fn()
              .mockImplementation((level, transactionalFunction) => {
                return transactionalFunction(mockEntityManager);
              }),
          },
        },
        { provide: AmqpConnection, useValue: createMock<AmqpConnection>() },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('statusChange: status change AWAITING_CONFIRMATION', async () => {
    const statusChange = await service.statusChange(
      invoice,
      InvoiceStatus.AWAITING_CONFIRMATION,
    );
    expect(statusChange).toBeInstanceOf(Object);
  });

  it('statusChange: status change CANCELLED', async () => {
    const statusChange = await service.statusChange(
      invoice,
      InvoiceStatus.CANCELLED,
    );
    expect(statusChange).toBeInstanceOf(Object);
  });

  it('statusChange: status change CONFIRMED_PENDING_PAYMENT', async () => {
    const statusChange = await service.statusChange(
      invoice,
      InvoiceStatus.CONFIRMED_PENDING_PAYMENT,
    );
    expect(statusChange).toBeInstanceOf(Object);
  });

  it('statusChange: status change PAID', async () => {
    const statusChange = await service.statusChange(
      invoice,
      InvoiceStatus.PAID,
    );
    expect(statusChange).toBeInstanceOf(Object);
  });
});
