import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { FileService } from './file.service';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
import { FolderFileNumberEntity } from './folder.view.entity';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  delete: async () => Promise.resolve([]),
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(FolderService.name, () => {
  let service: FolderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FolderService,
        {
          provide: FileService,
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FolderEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FolderFileNumberEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FolderService>(FolderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns folder.findOne', async () => {
    expect(await service.findOne({})).toStrictEqual([]);
  });

  // it('returns folder.find', async () => {
  //   expect(await folderService.find({})).toStrictEqual([]);
  // });

  // it('returns folder.findAndCount', async () => {
  //   expect(await folderService.findAndCount({})).toStrictEqual([]);
  // });

  it('returns folder.update', async () => {
    expect(await service.update({})).toStrictEqual([]);
  });

  // TODO: Implement
  // it('returns deleteFolder', async () => {
  //   expect(
  //     await folderService.delete({} as UserEntity, {} as FolderEntity),
  //   ).toBeDefined();
  // });
});
