import { Controller, Logger } from '@nestjs/common';

@Controller('/payments')
export class PaymentsController {
  logger = new Logger(PaymentsController.name);
}
