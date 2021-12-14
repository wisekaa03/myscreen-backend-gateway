import { Controller, Logger } from '@nestjs/common';

@Controller('/monitor')
export class MonitorController {
  logger = new Logger(MonitorController.name);
}
