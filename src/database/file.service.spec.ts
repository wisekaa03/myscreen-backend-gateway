import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getS3ConnectionToken } from 'nestjs-s3';
import { S3_MODULE_CONNECTION } from 'nestjs-s3/dist/s3.constants';

import { MailService } from '@/mail/mail.service';
import { FolderService } from './folder.service';
import { FileEntity } from './file.entity';
import { FilePreviewEntity } from './file-preview.entity';
import { FileService } from './file.service';
import { MonitorService } from './monitor.service';
import { EditorService } from './editor.service';
import { PlaylistService } from './playlist.service';

export const mockRepository = jest.fn(() => ({
  findOne: async () => Promise.resolve([]),
  findAndCount: async () => Promise.resolve([]),
  save: async () => Promise.resolve([]),
  create: () => [],
  remove: async () => Promise.resolve([]),
  get: async () => Promise.resolve(''),
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
        {
          provide: ConfigService,
          useClass: mockRepository,
        },
        {
          provide: MailService,
          useClass: mockRepository,
        },
        {
          provide: FolderService,
          useClass: mockRepository,
        },
        {
          provide: MonitorService,
          useClass: mockRepository,
        },
        {
          provide: EditorService,
          useClass: mockRepository,
        },
        {
          provide: PlaylistService,
          useClass: mockRepository,
        },
        {
          provide: getS3ConnectionToken(S3_MODULE_CONNECTION),
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
      ],
    }).compile();

    service = module.get(FileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: should inspect:
  // TODO: - getMediaFiles, getMediaFile, upload, getMediaFileS3, delete, metaInformation
});
