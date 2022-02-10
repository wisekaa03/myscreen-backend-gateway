import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from '@/guards';
import { FileService } from '@/database/file.service';
import { FileController } from './file.controller';
import { MonitorService } from '@/database/monitor.service';

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

describe(FileController.name, () => {
  let fileController: FileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: ConfigService,
          useClass: mockRepository,
        },
        {
          provide: FileService,
          useClass: mockRepository,
        },
        {
          provide: MonitorService,
          useClass: mockRepository,
        },
      ],
    }).compile();

    fileController = module.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(fileController).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata('__guards__', FileController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
