import { Controller, Logger } from '@nestjs/common';

@Controller('/folder')
export class FolderController {
  logger = new Logger(FolderController.name);
}
