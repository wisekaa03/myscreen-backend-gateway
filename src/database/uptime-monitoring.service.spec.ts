import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UptimeMonitoringEntity } from './uptime-monitoring.entity';
import { UptimeMonitoringService } from './uptime-monitoring.service';

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

describe(UptimeMonitoringService.name, () => {
  let uptimeMonitoringService: UptimeMonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UptimeMonitoringService,
        {
          provide: getRepositoryToken(UptimeMonitoringEntity),
          useClass: mockRepository,
        },
      ],
    }).compile();

    uptimeMonitoringService = module.get<UptimeMonitoringService>(
      UptimeMonitoringService,
    );
  });

  it('should be defined', () => {
    expect(uptimeMonitoringService).toBeDefined();
  });
});
