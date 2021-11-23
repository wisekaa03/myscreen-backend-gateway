import { Controller, Logger } from '@nestjs/common';

@Controller('/video')
export class VideoController {
  logger = new Logger(VideoController.name);
}
