import { Controller, Logger } from '@nestjs/common';

@Controller('/user')
export class UserController {
  logger = new Logger(UserController.name);
}
