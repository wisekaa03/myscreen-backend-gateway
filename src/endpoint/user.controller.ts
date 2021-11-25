import { Controller, Logger } from '@nestjs/common';

@Controller('/user')
export class UsersController {
  logger = new Logger(UsersController.name);
}
