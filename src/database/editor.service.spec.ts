import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { EditorLayerEntity } from './editor-layer.entity';
import { EditorEntity } from './editor.entity';
import { EditorService } from './editor.service';
import { FileService } from './file.service';
import { FolderService } from './folder.service';
import { PlaylistService } from './playlist.service';
import { MonitorService } from './monitor.service';
import { CrontabService } from '@/crontab/crontab.service';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  insert: async () => Promise.resolve([]),
  update: async () => Promise.resolve([]),
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(EditorService.name, () => {
  let service: EditorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditorService,
        { provide: ConfigService, useClass: mockRepository },
        { provide: CrontabService, useClass: mockRepository },
        { provide: FileService, useClass: mockRepository },
        { provide: FolderService, useClass: mockRepository },
        { provide: PlaylistService, useClass: mockRepository },
        { provide: MonitorService, useClass: mockRepository },
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

    service = module.get(EditorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
