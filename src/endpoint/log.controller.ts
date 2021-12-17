import { Controller, Logger } from '@nestjs/common';

@Controller('log')
export class LogController {
  logger = new Logger(LogController.name);
}
