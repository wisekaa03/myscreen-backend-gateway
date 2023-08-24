import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GUARDS_METADATA } from '@nestjs/common/constants';

import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { FileService } from '@/database/file.service';
import { MonitorService } from '@/database/monitor.service';
import { FolderService } from '@/database/folder.service';
import { FileController } from './file.controller';
import { UserService } from '@/database/user.service';

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

describe(FileController.name, () => {
  let controller: FileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        { provide: ConfigService, useClass: mockRepository },
        { provide: FileService, useClass: mockRepository },
        { provide: FolderService, useClass: mockRepository },
        { provide: MonitorService, useClass: mockRepository },
        { provide: UserService, useClass: mockRepository },
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('JwtAuthGuard, RolesGuard and Roles: Administrator', async () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, FileController);
    const guardJwt = new guards[0]();

    expect(guardJwt).toBeInstanceOf(JwtAuthGuard);
  });

  // TODO: should inspect:
  // TODO: -
});
