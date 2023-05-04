import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import xlsx from 'node-xlsx';

@Injectable()
export class XlsxService {
  logger = new Logger(XlsxService.name);

  async invoice(userId: string): Promise<Buffer> {
    const data: any = [];
    const options: any = {};

    return xlsx.build([
      {
        name: 'Счёт',
        data,
        options,
      },
    ]);
  }
}
