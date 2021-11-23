import { Controller, Logger } from '@nestjs/common';

@Controller('/monitors')
export class MonitorsController {
  logger = new Logger(MonitorsController.name);
}
