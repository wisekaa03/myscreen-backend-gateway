import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FolderEntity } from './folder.entity';
import { FolderService } from './folder.service';

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

describe(FolderService.name, () => {
  let folderService: FolderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FolderService,
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
    expect(await folderService.findFolder({})).toStrictEqual([]);
  });

  it('returns findFolders', async () => {
    expect(await folderService.findFolders({})).toStrictEqual([]);
  });

  it('returns updateFolder', async () => {
    expect(await folderService.updateFolder({})).toStrictEqual([]);
  });

  it('returns deleteFolder', async () => {
    expect(await folderService.deleteFolder({} as FolderEntity)).toStrictEqual(
      [],
    );
  });
});
