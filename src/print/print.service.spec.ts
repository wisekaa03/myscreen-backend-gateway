import { Test, TestingModule } from '@nestjs/testing';

import { PrintService } from './print.service';
import {
  InvoiceStatus,
  SpecificFormat,
  UserPlanEnum,
  UserRoleEnum,
} from '@/enums';
import { InvoiceEntity } from '@/database/invoice.entity';
import { UserEntity } from '@/database/user.entity';

export const mockRepository = jest.fn(() => ({
  findById: async () => Promise.resolve({}),
  findOne: async () => Promise.resolve({}),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve({}),
  create: () => {},
  remove: async () => Promise.resolve({}),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

const mockEntityUser: UserEntity = {
  id: '1',
  email: 'we@are.the.best',
  surname: 'Test',
  middleName: 'Test',
  name: 'Test',
  role: UserRoleEnum.Administrator,
  plan: UserPlanEnum.Full,
  disabled: false,
  verified: true,
  company: 'Test Company',
};

const mockEntityInvoice: InvoiceEntity = {
  id: '1',
  sum: 100,
  seqNo: 1,
  user: mockEntityUser,
  userId: mockEntityUser.id,
  description: 'Testing description',
  status: InvoiceStatus.PAID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

  it('Invoice XLSX', async () => {
    const xlsFile = await printService.invoice(
      SpecificFormat.XLSX,
      mockEntityInvoice,
    );
    expect(xlsFile).toBeDefined();
  });

  it('Invoice PDF', async () => {
    const pdfFile = await printService.invoice(
      SpecificFormat.PDF,
      mockEntityInvoice,
    );
    expect(pdfFile).toBeDefined();
  });

  it('Device status XLSX', async () => {
    const xlsFile = await printService.reportDeviceStatus({
      format: SpecificFormat.PDF,
      user: mockEntityUser,
      dateFrom: new Date(),
      dateTo: new Date(),
    });
    expect(xlsFile).toBeDefined();
  });

  it('Device status PDF', async () => {
    const pdfFile = await printService.reportDeviceStatus({
      format: SpecificFormat.PDF,
      user: mockEntityUser,
      dateFrom: new Date(),
      dateTo: new Date(),
    });
    expect(pdfFile).toBeDefined();
  });

  it('Views XLSX', async () => {
    const xlsFile = await printService.reportViews({
      format: SpecificFormat.PDF,
      user: mockEntityUser,
      dateFrom: new Date(),
      dateTo: new Date(),
    });
    expect(xlsFile).toBeDefined();
  });

  it('Views PDF', async () => {
    const pdfFile = await printService.reportViews({
      format: SpecificFormat.PDF,
      user: mockEntityUser,
      dateFrom: new Date(),
      dateTo: new Date(),
    });
    expect(pdfFile).toBeDefined();
  });
});
