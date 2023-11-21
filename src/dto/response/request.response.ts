import { OmitType } from '@nestjs/swagger';

import { ApplicationEntity } from '@/database/request.entity';

export class ApplicationResponse extends OmitType(ApplicationEntity, [
  'buyerId',
  'sellerId',
  'monitorId',
  'playlistId',
]) {}
