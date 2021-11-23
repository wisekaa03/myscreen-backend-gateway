import { Controller, Logger } from '@nestjs/common';

@Controller('/orders')
export class OrdersController {
  logger = new Logger(OrdersController.name);
}
