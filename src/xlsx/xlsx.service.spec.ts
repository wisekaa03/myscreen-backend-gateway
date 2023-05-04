import { Test, TestingModule } from '@nestjs/testing';
import { XlsxService } from './xlsx.service';

describe(XlsxService.name, () => {
  let xlsxService: XlsxService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XlsxService],
    }).compile();

    xlsxService = module.get<XlsxService>(XlsxService);
  });

  it('should be defined', () => {
    expect(xlsxService).toBeDefined();
  });
});
