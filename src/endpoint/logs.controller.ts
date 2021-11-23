import { Controller, Logger } from '@nestjs/common';

@Controller('/logs')
export class LogsController {
  logger = new Logger(LogsController.name);
}
