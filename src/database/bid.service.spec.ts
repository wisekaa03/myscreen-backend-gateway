import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { MAIL_SERVICE } from '@/constants';
import { WSGateway } from '@/websocket/ws.gateway';
import { BidEntity } from './bid.entity';
import { BidService } from './bid.service';
import { UserService } from './user.service';
import { MonitorEntity } from './monitor.entity';
import { MonitorService } from './monitor.service';
import { EditorService } from './editor.service';
import { FileService } from './file.service';
import { PlaylistService } from './playlist.service';
import { ActService } from './act.service';

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

describe(BidService.name, () => {
  let service: BidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: UserService, useClass: mockRepository },
        { provide: ActService, useClass: mockRepository },
        { provide: MonitorService, useClass: mockRepository },
        { provide: PlaylistService, useClass: mockRepository },
        { provide: FileService, useClass: mockRepository },
        { provide: EditorService, useClass: mockRepository },
        { provide: MAIL_SERVICE, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        { provide: WSGateway, useClass: mockRepository },
        {
          provide: getRepositoryToken(MonitorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(BidEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get(BidService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
