import { Controller, Logger } from '@nestjs/common';

@Controller('/stats')
export class UptimeController {
  logger = new Logger(UptimeController.name);
}
