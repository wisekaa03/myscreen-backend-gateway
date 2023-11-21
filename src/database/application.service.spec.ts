import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { WSGateway } from '@/websocket/ws.gateway';
import { MailService } from '@/mail/mail.service';
import { ApplicationEntity } from './application.entity';
import { ApplicationService } from './application.service';
import { UserService } from './user.service';
import { MonitorEntity } from './monitor.entity';
import { MonitorService } from './monitor.service';
import { EditorService } from './editor.service';

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

describe(ApplicationService.name, () => {
  let service: ApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationService,
        { provide: UserService, useClass: mockRepository },
        { provide: MonitorService, useClass: mockRepository },
        { provide: EditorService, useClass: mockRepository },
        { provide: MailService, useClass: mockRepository },
        { provide: ConfigService, useClass: mockRepository },
        { provide: WSGateway, useClass: mockRepository },
        {
          provide: getRepositoryToken(MonitorEntity),
          useClass: mockRepository,
        },
        {
          provide: getRepositoryToken(ApplicationEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    service = module.get(ApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
