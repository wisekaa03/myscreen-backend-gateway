import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EditorLayerEntity } from './editor-layer.entity';
import { EditorEntity } from './editor.entity';
import { EditorService } from './editor.service';
import { FileService } from './file.service';
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

describe(EditorService.name, () => {
  let editorService: EditorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditorService,
        ConfigService,
        {
          provide: FileService,
          useClass: mockRepository,
        },
        {
          provide: FolderService,
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(EditorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(EditorLayerEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    editorService = module.get<EditorService>(EditorService);
  });

  it('should be defined', () => {
    expect(editorService).toBeDefined();
  });
});
