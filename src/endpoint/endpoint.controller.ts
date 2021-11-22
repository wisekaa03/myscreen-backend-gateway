import { Controller, Logger } from '@nestjs/common';

@Controller()
export class EndpointController {
  logger = new Logger(EndpointController.name);
}
