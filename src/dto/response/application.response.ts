import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/application.entity';

export class ApplicationResponse extends OmitType(ApplicationEntity, [
  'buyerId',
  'sellerId',
  'monitorId',
  'playlistId',
]) {}
