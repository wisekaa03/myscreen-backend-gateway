import { Controller, Logger } from '@nestjs/common';

@Controller('/playlist')
export class PlaylistController {
  logger = new Logger(PlaylistController.name);
}
