import { Controller, Logger } from '@nestjs/common';

@Controller('/users')
export class UsersController {
  logger = new Logger(UsersController.name);
}
