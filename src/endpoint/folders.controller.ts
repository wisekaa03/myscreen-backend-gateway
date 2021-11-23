import { Controller, Logger } from '@nestjs/common';

@Controller('/folders')
export class FoldersController {
  logger = new Logger(FoldersController.name);
}
