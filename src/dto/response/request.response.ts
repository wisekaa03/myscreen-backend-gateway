import { OmitType } from '@nestjs/swagger';

import { RequestEntity } from '@/database/request.entity';

export class RequestResponse extends OmitType(RequestEntity, [
  'buyerId',
  'sellerId',
  'monitorId',
  'playlistId',
]) {}
