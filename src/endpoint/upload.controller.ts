import { Controller, Logger } from '@nestjs/common';

@Controller('/upload')
export class UploadController {
  logger = new Logger(UploadController.name);
}
