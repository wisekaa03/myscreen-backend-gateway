import { Controller, Logger } from '@nestjs/common';

@Controller('/playlists')
export class PlaylistsController {
  logger = new Logger(PlaylistsController.name);
}
