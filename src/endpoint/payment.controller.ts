import { Controller, Logger } from '@nestjs/common';

@Controller('/payment')
export class PaymentController {
  logger = new Logger(PaymentController.name);
}
