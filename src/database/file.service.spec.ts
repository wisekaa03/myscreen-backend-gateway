import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getEntityManagerToken, getRepositoryToken } from '@nestjs/typeorm';
import { getS3ConnectionToken } from 'nestjs-s3-aws';
import { S3_MODULE_CONNECTION } from 'nestjs-s3-aws/dist/s3.constants';

import { FileEntity } from './file.entity';
import { FilePreviewEntity } from './file-preview.entity';
import { FileService } from './file.service';
import { EditorEntity } from './editor.entity';
import { MonitorEntity } from './monitor.entity';
import { PlaylistEntity } from './playlist.entity';
import { FolderEntity } from './folder.entity';
import { WsStatistics } from './ws.statistics';
import { FileExtView } from './file-ext.view';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  insert: async () => Promise.resolve([]),
  update: async () => Promise.resolve([]),
  remove: async () => Promise.resolve([]),
  get: (key: string, defaultValue?: string) => defaultValue,
  getOrThrow: (key: string, defaultValue?: string) => 'upload',
  metadata: {
    columns: [],
    relations: [],
  },
}));

describe(FileService.name, () => {
  let service: FileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileService,
        { provide: ConfigService, useClass: mockRepository },
        { provide: WsStatistics, useClass: mockRepository },
        {
          provide: getS3ConnectionToken(S3_MODULE_CONNECTION),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FolderEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FileEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FilePreviewEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(EditorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(MonitorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(PlaylistEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(FileExtView),
          useClass: mockRepository,
        },
        {
          provide: getEntityManagerToken(),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: - getMediaFiles, getMediaFile, upload, getMediaFileS3, delete
});
