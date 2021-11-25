import { Controller, Logger } from '@nestjs/common';

@Controller('/order')
export class OrderController {
  logger = new Logger(OrderController.name);
}
