import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileService } from './file.service';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';
import { UserEntity } from './user.entity';

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
  let folderService: FolderService;

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
      ],
    }).compile();

    folderService = module.get<FolderService>(FolderService);
  });

  it('should be defined', () => {
    expect(folderService).toBeDefined();
  });

  it('returns findFolder', async () => {
    expect(await folderService.findOne({})).toStrictEqual([]);
  });

  it('returns findFolders', async () => {
    expect(await folderService.find({})).toStrictEqual([]);
  });

  it('returns updateFolder', async () => {
    expect(await folderService.update({})).toStrictEqual([]);
  });

  // TODO: Implement
  // it('returns deleteFolder', async () => {
  //   expect(
  //     await folderService.delete({} as UserEntity, {} as FolderEntity),
  //   ).toBeDefined();
  // });
});
