import { Controller, Logger } from '@nestjs/common';

@Controller('/editor')
export class EditorController {
  logger = new Logger(EditorController.name);
}
