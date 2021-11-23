import { Controller, Logger } from '@nestjs/common';

@Controller('/media')
export class MediaController {
  logger = new Logger(MediaController.name);
}
