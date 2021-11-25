import { Controller, Logger } from '@nestjs/common';

@Controller('/file')
export class FileController {
  logger = new Logger(FileController.name);
}
