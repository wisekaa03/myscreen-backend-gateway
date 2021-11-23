import { Controller, Logger } from '@nestjs/common';

@Controller('/auth')
export class AuthController {
  logger = new Logger(AuthController.name);
}
