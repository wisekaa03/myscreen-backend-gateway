import { Controller, Logger } from '@nestjs/common';

@Controller('/files')
export class FilesController {
  logger = new Logger(FilesController.name);
}
